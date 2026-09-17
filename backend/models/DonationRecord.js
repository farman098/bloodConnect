import mongoose from "mongoose";

const donationRecordSchema = new mongoose.Schema(
    {
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "donorId is required"],
        },
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BloodRequest",
            required: [true, "requestId is required"],
        },
        donatedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "completed", "cancelled"],
                message: "{VALUE} is not a valid donation status",
            },
            default: "pending",
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },
    },
    { timestamps: true },
);

export default mongoose.model("DonationRecord", donationRecordSchema);
