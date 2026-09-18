import express from "express";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const ratings = await Rating.find({ approved: true }).sort({ createdAt: -1 }).limit(12).lean();
        const summary = await Rating.aggregate([
            { $match: { approved: true } },
            { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);
        res.json({ ratings, average: summary[0]?.average || 0, count: summary[0]?.count || 0 });
    } catch (error) {
        console.error("Ratings load error:", error.message);
        res.status(500).json({ message: "Unable to load ratings." });
    }
});

router.post("/", requireAuth, async (req, res) => {
    try {
        const rating = Number(req.body.rating);
        const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
        const user = await User.findById(req.user.id).select("name");
        if (!user) return res.status(404).json({ message: "User profile not found." });
        if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || comment.length > 500) {
            return res.status(400).json({ message: "Please provide a rating from 1 to 5 and a comment up to 500 characters." });
        }
        const existing = await Rating.findOne({ userId: user._id });
        if (existing) return res.status(409).json({ message: "You have already submitted a rating." });
        const created = await Rating.create({ userId: user._id, name: user.name, rating, comment, approved: true });
        res.status(201).json({ message: "Thanks. Your rating is now visible on the homepage.", rating: created });
    } catch (error) {
        console.error("Rating submit error:", error.message);
        res.status(400).json({ message: "Unable to submit your rating." });
    }
});

export default router;