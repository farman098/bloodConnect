import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
    try {
        const requests = await BloodRequest.find({ status: { $in: ["Open", "Matched"] } }).sort({ createdAt: -1 }).limit(20);
        res.json(requests);
    } catch {
        res.status(500).json({ message: "Unable to load blood requests." });
    }
});

router.patch("/:id/respond", requireAuth, async (req, res) => {
    try {
        const { response } = req.body;
        if (!["Accepted", "Declined"].includes(response)) {
            return res.status(400).json({ message: "Response must be Accepted or Declined." });
        }

        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Blood request not found." });

        request.donorResponses = request.donorResponses.filter((item) => String(item.donor) !== String(req.user.id));
        request.donorResponses.push({ donor: req.user.id, response });
        if (response === "Accepted") request.status = "Matched";
        await request.save();
        res.json(request);
    } catch {
        res.status(500).json({ message: "Unable to save your response." });
    }
});

router.post("/", requireAuth, async (req, res) => {
    try {
        const request = await BloodRequest.create({ ...req.body, createdBy: req.user.id });
        res.status(201).json(request);
    } catch {
        res.status(400).json({ message: "Please provide valid request details." });
    }
});

export default router;
