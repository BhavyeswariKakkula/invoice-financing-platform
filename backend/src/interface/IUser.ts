import { Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "business";
  companyName: string;
  isVerified: boolean;
  emailVerificationOTP?: string;
  emailVerificationExpiry?: Date;
  passwordResetOTP?: string;
  passwordResetExpiry?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
