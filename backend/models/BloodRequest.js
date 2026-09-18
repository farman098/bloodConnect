import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
    {
        patientName: { type: String, required: true, trim: true },
        bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
        units: { type: Number, required: true, min: 1, max: 20 },
        hospital: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        urgency: { type: String, enum: ["Normal", "Urgent", "Critical", "Scheduled"], default: "Urgent" },
        status: { type: String, enum: ["Open", "Pending", "Matched", "Completed"], default: "Open" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        donorResponses: [{
            donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            response: { type: String, enum: ["Accepted", "Declined"] },
            respondedAt: { type: Date, default: Date.now },
        }],
    },
    { timestamps: true },
);

export default mongoose.model("BloodRequest", bloodRequestSchema);
