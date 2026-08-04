import mongoose, { Schema } from "mongoose";
import { IRepaymentSchedule } from "../interface/IRepaymentSchedule";

const repaymentScheduleSchema = new Schema<IRepaymentSchedule>(
  {
    repaymentId: {
      type: Schema.Types.ObjectId,
      ref: "Repayment",
      required: true,
    },
    financingId: {
      type: Schema.Types.ObjectId,
      ref: "FinancingRequest",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    totalInstallments: {
      type: Number,
      required: true,
      min: 1,
    },
    openingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    emiAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    closingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
    },
    paidAmount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "prepaid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "cash", "other"],
    },
    transactionId: {
      type: String,
    },
    paymentProof: {
      type: String,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    remarks: {
      type: String,
    },
    rejectedReason: {
      type: String,
    },
    lateFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeePaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

repaymentScheduleSchema.index({ repaymentId: 1, installmentNumber: 1 }, { unique: true });
repaymentScheduleSchema.index({ repaymentId: 1 });
repaymentScheduleSchema.index({ businessId: 1 });
repaymentScheduleSchema.index({ financingId: 1 });
repaymentScheduleSchema.index({ invoiceId: 1 });
repaymentScheduleSchema.index({ status: 1 });
repaymentScheduleSchema.index({ dueDate: 1 });

const RepaymentSchedule = mongoose.model<IRepaymentSchedule>(
  "RepaymentSchedule",
  repaymentScheduleSchema
);

export default RepaymentSchedule;
