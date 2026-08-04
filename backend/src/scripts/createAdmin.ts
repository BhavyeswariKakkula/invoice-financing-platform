import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import User from "../models/User";

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@invoice.com" });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      fullName: "System Admin",
      email: "admin@invoice.com",
      password: hashedPassword,
      role: "admin",
      companyName: "InvoiceFin Platform",
      isVerified: true,
    });

    console.log("Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }
};

createAdmin();
