import mongoose, { Schema } from "mongoose";
import { IBusinessProfile } from "../interface/IBusinessProfile";

const businessProfileSchema = new Schema<IBusinessProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      required: true,
      trim: true,
    },
    panNumber: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    bankDetails: {
      bankName: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, trim: true },
      branch: { type: String, required: true, trim: true },
    },
    businessCategory: {
      type: String,
      required: true,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationRemarks: {
      type: String,
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

businessProfileSchema.index({ userId: 1 });
businessProfileSchema.index({ verificationStatus: 1 });

const BusinessProfile = mongoose.model<IBusinessProfile>(
  "BusinessProfile",
  businessProfileSchema
);

export default BusinessProfile;
