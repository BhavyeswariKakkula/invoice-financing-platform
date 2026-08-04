import mongoose, { Schema } from "mongoose";
import { IInvoice } from "../interface/IInvoice";

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    buyerCompany: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    invoiceFile: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_verification",
        "verified",
        "rejected",
        "requires_correction",
        "financed",
        "closed",
      ],
      default: "draft",
    },
    verificationRemarks: {
      type: String,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);

export default Invoice;
