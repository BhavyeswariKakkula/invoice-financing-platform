import mongoose, { Schema } from "mongoose";
import { IFinancingRequest } from "../interface/IFinancingRequest";

const financingRequestSchema = new Schema<IFinancingRequest>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedAmount: {
      type: Number,
      min: 0,
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      default: 2,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    processingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "disbursed",
        "repayment",
        "completed",
      ],
      default: "pending",
    },
    remarks: {
      type: String,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    disbursedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

financingRequestSchema.index({ userId: 1 });
financingRequestSchema.index({ invoiceId: 1 });
financingRequestSchema.index({ status: 1 });
financingRequestSchema.index({ createdAt: -1 });

const FinancingRequest = mongoose.model<IFinancingRequest>(
  "FinancingRequest",
  financingRequestSchema
);

export default FinancingRequest;
