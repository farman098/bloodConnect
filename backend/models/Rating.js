import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true, maxlength: 80 },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true, maxlength: 500 },
        approved: { type: Boolean, default: true },
    },
    { timestamps: true },
);

ratingSchema.index({ approved: 1, createdAt: -1 });

export default mongoose.model("Rating", ratingSchema);