import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error("MongoDB URI missing. Set MONGO_URI or MONGODB_URI in the environment.");
            return;
        }

        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
        console.log("MongoDB connected");
        return true;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        return false;
    }
};

export default connectDB;