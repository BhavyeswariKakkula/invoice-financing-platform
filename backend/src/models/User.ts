import mongoose, { Schema } from "mongoose";
import { IUser } from "../interface/IUser";

const userSchema = new Schema<IUser>(
  {
    fullName: {
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
    },
    role: {
      type: String,
      enum: ["admin", "business"],
      default: "business",
    },
  
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
    passwordResetOTP: {
      type: String,
    },
    passwordResetExpiry: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
