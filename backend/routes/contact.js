import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required." });
    next();
};

router.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email, and message are required." });
        }

        const contactMessage = await ContactMessage.create({ name, email, message });
        res.status(201).json({ message: "Contact message saved.", id: contactMessage.id });
    } catch {
        res.status(400).json({ message: "Unable to save contact message." });
    }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
        res.json(messages);
    } catch {
        res.status(500).json({ message: "Unable to load contact messages." });
    }
});

export default router;
