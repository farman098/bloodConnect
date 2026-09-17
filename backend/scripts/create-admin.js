import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import connectDB from "../connection.js";
import User from "../models/User.js";

dotenv.config();
dotenv.config({ path: "./atlas-credentials.env" });

const readline = createInterface({ input, output });
const name = (process.env.ADMIN_NAME || await readline.question("Admin name: ")).trim();
const email = (process.env.ADMIN_EMAIL || await readline.question("Admin email: ")).trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || await readline.question("Admin password: ");
readline.close();

if (!name || !email || !password) {
    console.error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this command.");
    process.exit(1);
}

if (password.length < 6) {
    console.error("ADMIN_PASSWORD must contain at least 6 characters.");
    process.exit(1);
}

try {
    const connected = await connectDB();
    if (!connected) process.exit(1);

    const passwordHash = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        existingUser.name = name;
        existingUser.password = passwordHash;
        existingUser.role = "admin";
        existingUser.bloodType ||= "O+";
        await existingUser.save();
        console.log(`Admin access updated for ${email}.`);
    } else {
        await User.create({
            name,
            email,
            password: passwordHash,
            bloodType: "O+",
            eligibility: "Eligible",
            role: "admin",
        });
        console.log(`Admin account created for ${email}.`);
    }
} catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}