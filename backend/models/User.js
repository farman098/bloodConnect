import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        bloodType: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            required: true,
        },
        city: { type: String, trim: true, maxlength: 100 },
        age: { type: Number, min: 16, max: 100 },
        eligibility: {
            type: String,
            enum: ["Eligible", "Needs review", "Not eligible"],
            default: "Needs review",
        },
        availability: {
            type: String,
            enum: ["Available", "Not Available"],
            default: "Available",
        },
        lastDonationDate: { type: Date },
        donationHistory: [{
            date: { type: Date, required: true },
            location: { type: String, trim: true },
            units: { type: Number, min: 1, default: 1 },
        }],
        role: {
            type: String,
            enum: ["donor", "requester", "admin"],
            default: "donor",
        },
    },
    { timestamps: true },
);

export default mongoose.model("User", userSchema);
