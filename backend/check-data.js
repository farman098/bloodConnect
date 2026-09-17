import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import BloodRequest from "./models/BloodRequest.js";
import DonationRecord from "./models/DonationRecord.js";
import Response from "./models/Response.js";
import ContactMessage from "./models/ContactMessage.js";

dotenv.config();
dotenv.config({ path: "./atlas-credentials.env" });

const models = [
    { name: "Users", model: User },
    { name: "BloodRequests", model: BloodRequest },
    { name: "DonationRecords", model: DonationRecord },
    { name: "Responses", model: Response },
    { name: "ContactMessages", model: ContactMessage },
];

const redactSensitiveFields = (document) => {
    if (!document) return document;

    const safeDocument = document.toObject ? document.toObject() : { ...document };
    if (safeDocument.password) safeDocument.password = "[redacted]";
    return safeDocument;
};

const checkData = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI or MONGODB_URI is missing from .env");
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`Connected to database: ${mongoose.connection.name}`);

    for (const { name, model } of models) {
        const count = await model.countDocuments();
        const sample = await model.findOne().lean();

        console.log(`\n${name}: ${count} document(s)`);
        console.dir(redactSensitiveFields(sample), { depth: null, colors: true });
    }
};

try {
    await checkData();
} catch (error) {
    console.error("Database check failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
}
