import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        status: { type: String, enum: ["New", "Read", "Resolved"], default: "New" },
    },
    { timestamps: true },
);

export default mongoose.model("ContactMessage", contactMessageSchema);
