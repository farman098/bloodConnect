import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import Notification from "../models/Notification.js";
import Response from "../models/Response.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import { formatUrgency, getDonationEligibility, urgencyWeight } from "../utils/eligibility.js";

const router = express.Router();
const bloodTypes = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const requestFields = ["patientName", "bloodType", "units", "hospital", "city", "urgency"];

const cleanText = (value, max = 120) => typeof value === "string" ? value.trim().slice(0, max) : value;

function serializeFeedRequest(request, donor, response) {
    return {
        id: request._id,
        patientName: request.patientName,
        bloodType: request.bloodType,
        hospital: request.hospital,
        city: request.city,
        urgency: request.urgency,
        urgencyLabel: formatUrgency(request.urgency),
        units: request.units,
        status: request.status,
        createdAt: request.createdAt,
        responseStatus: response?.status || null,
        eligibility: getDonationEligibility(donor.lastDonationDate),
    };
}

const requestContact = (user) => ({ name: user.name, email: user.email, city: user.city || null });

router.get("/", requireAuth, async (req, res) => {
    try {
        if (req.user.role !== "donor") return res.status(403).json({ message: "Only donors can view the donor request feed." });
        const donor = await User.findById(req.user.id).select("bloodType city lastDonationDate").lean();
        if (!donor) return res.status(404).json({ message: "Donor profile not found." });
        const { bloodType = "mine", sort = "newest" } = req.query;
        const filter = { status: { $in: ["Open", "Pending"] } };
        if (bloodType === "mine") filter.bloodType = donor.bloodType;
        else if (bloodType !== "all") {
            if (!bloodTypes.has(bloodType)) return res.status(400).json({ message: "Invalid blood group filter." });
            filter.bloodType = bloodType;
        }
        const requests = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(100).lean();
        const responses = await Response.find({ donorId: donor._id, requestId: { $in: requests.map((item) => item._id) } }).lean();
        const responseByRequest = new Map(responses.map((item) => [String(item.requestId), item]));
        const feed = requests.map((request) => serializeFeedRequest(request, donor, responseByRequest.get(String(request._id))));
        feed.sort((left, right) => {
            if (sort === "urgent") return urgencyWeight(right.urgency) - urgencyWeight(left.urgency) || new Date(right.createdAt) - new Date(left.createdAt);
            if (sort === "nearest") return (left.city === donor.city ? -1 : 1) - (right.city === donor.city ? -1 : 1) || new Date(right.createdAt) - new Date(left.createdAt);
            return new Date(right.createdAt) - new Date(left.createdAt);
        });
        res.json(feed);
    } catch (error) {
        console.error("Request feed error:", error.message);
        res.status(500).json({ message: "Unable to load blood requests." });
    }
});

router.get("/activity", requireAuth, async (req, res) => {
    try {
        if (req.user.role !== "donor") return res.status(403).json({ message: "Only donors can view donor activity." });
        const [donor, responses] = await Promise.all([
            User.findById(req.user.id).select("lastDonationDate donationHistory").lean(),
            Response.find({ donorId: req.user.id }).populate("requestId", "patientName bloodType units hospital city urgency status").sort({ updatedAt: -1 }).lean(),
        ]);
        res.json({ totalDonations: donor?.donationHistory?.length || 0, lastDonationDate: donor?.lastDonationDate || null, acceptedRequests: responses });
    } catch (error) {
        console.error("Donor activity error:", error.message);
        res.status(500).json({ message: "Unable to load donor activity." });
    }
});

router.get("/notifications", requireAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
        res.json(notifications);
    } catch {
        res.status(500).json({ message: "Unable to load notifications." });
    }
});

router.get("/my-responses", requireAuth, async (req, res) => {
    try {
        const responses = await Response.find({ donorId: req.user.id }).populate("requestId", "patientName bloodType units hospital city urgency status").sort({ respondedAt: -1 });
        res.json(responses);
    } catch {
        res.status(500).json({ message: "Unable to load your responses." });
    }
});

router.post("/:id/accept", requireAuth, async (req, res) => {
    try {
        if (req.user.role !== "donor") return res.status(403).json({ message: "Only donors can accept blood requests." });
        const donor = await User.findById(req.user.id).select("name email bloodType city lastDonationDate");
        const request = await BloodRequest.findById(req.params.id);
        if (!donor || !request) return res.status(404).json({ message: "Blood request not found." });
        if (request.bloodType !== donor.bloodType) return res.status(403).json({ message: "Your blood group does not match this request." });
        if (!["Open", "Pending"].includes(request.status)) return res.status(409).json({ message: "This request is no longer available." });
        const eligibility = getDonationEligibility(donor.lastDonationDate);
        if (!eligibility.eligible) return res.status(403).json({ message: `You are not eligible to donate yet. Eligible on ${eligibility.eligibleOn.toISOString().slice(0, 10)}.` });

        const response = await Response.findOneAndUpdate({ requestId: request._id, donorId: donor._id }, { status: "accepted", respondedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        request.donorResponses = request.donorResponses.filter((item) => String(item.donor) !== String(donor._id));
        request.donorResponses.push({ donor: donor._id, response: "Accepted" });
        request.status = "Matched";
        await request.save();
        const requester = await User.findById(request.createdBy).select("name email city");
        if (requester) await Notification.create({ recipientId: requester._id, requestId: request._id, type: "accepted", message: `${donor.name} accepted the ${request.bloodType} request.` });
        res.json({ response, request: { id: request._id, status: request.status }, requester: requester ? requestContact(requester) : null, donor: requestContact(donor) });
    } catch (error) {
        console.error("Accept request error:", error.message);
        res.status(500).json({ message: "Unable to accept this request." });
    }
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
    try {
        if (req.user.role !== "donor") return res.status(403).json({ message: "Only donors can cancel an acceptance." });
        const response = await Response.findOneAndUpdate({ requestId: req.params.id, donorId: req.user.id, status: "accepted" }, { status: "cancelled", respondedAt: new Date() }, { new: true });
        if (!response) return res.status(404).json({ message: "No active acceptance found for this request." });
        const request = await BloodRequest.findByIdAndUpdate(req.params.id, { status: "Pending" }, { new: true });
        if (!request) return res.status(404).json({ message: "Blood request not found." });
        const requester = await User.findById(request.createdBy).select("name");
        if (requester) await Notification.create({ recipientId: requester._id, requestId: request._id, type: "cancelled", message: "A donor cancelled their acceptance. The request is available again." });
        res.json({ response, request: { id: request._id, status: request.status } });
    } catch (error) {
        console.error("Cancel request error:", error.message);
        res.status(500).json({ message: "Unable to cancel this acceptance." });
    }
});

router.patch("/:id/respond", requireAuth, async (req, res) => {
    if (req.body.response === "Accepted") return res.status(410).json({ message: "Use the acceptance confirmation flow." });
    try {
        await Response.findOneAndUpdate({ requestId: req.params.id, donorId: req.user.id }, { status: "declined", respondedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.json({ message: "Request declined." });
    } catch {
        res.status(500).json({ message: "Unable to save your response." });
    }
});

router.post("/", requireAuth, async (req, res) => {
    try {
        if (req.user.role !== "requester") return res.status(403).json({ message: "Only requesters can create blood requests." });
        const values = Object.fromEntries(requestFields.map((field) => [field, req.body[field]]));
        values.patientName = cleanText(values.patientName, 100);
        values.hospital = cleanText(values.hospital, 150);
        values.city = cleanText(values.city, 100);
        values.bloodType = cleanText(values.bloodType, 3);
        values.units = Number(values.units);
        if (!values.patientName || !values.hospital || !values.city || !bloodTypes.has(values.bloodType) || !Number.isInteger(values.units) || values.units < 1 || values.units > 20) return res.status(400).json({ message: "Please provide valid blood request details." });
        const request = await BloodRequest.create({ ...values, createdBy: req.user.id });
        const donors = await User.find({ role: "donor", bloodType: request.bloodType, availability: "Available", $or: [{ city: request.city }, { city: { $exists: false } }] }).select("_id lastDonationDate").lean();
        const eligibleDonors = donors.filter((donor) => getDonationEligibility(donor.lastDonationDate).eligible);
        if (eligibleDonors.length) await Notification.insertMany(eligibleDonors.map((donor) => ({ recipientId: donor._id, requestId: request._id, type: "new-request", message: `A new ${request.bloodType} blood request is available in ${request.city}.` })));
        res.status(201).json(request);
    } catch (error) {
        console.error("Create request error:", error.message);
        res.status(400).json({ message: "Please provide valid request details." });
    }
});

export default router;
