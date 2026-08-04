import mongoose, { Schema } from "mongoose";
import { IRepayment } from "../interface/IRepayment";

const repaymentSchema = new Schema<IRepayment>(
  {
    financingId: {
      type: Schema.Types.ObjectId,
      ref: "FinancingRequest",
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    disbursedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    annualInterestRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    emiAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalInterest: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    principalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeeCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingPrincipal: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingInterest: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalInstallments: {
      type: Number,
      required: true,
      min: 1,
    },
    emisPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentInstallmentNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    nextDueDate: {
      type: Date,
    },
    submittedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    submittedPaymentType: {
      type: String,
      enum: ["emi", "prepay", "close"],
    },
    submittedInstallmentCount: {
      type: Number,
      min: 0,
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
    paymentDate: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    remarks: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    closedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "partial",
        "paid",
        "overdue",
        "rejected",
        "active",
        "completed",
        "prepaid",
      ],
      default: "pending",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

repaymentSchema.index({ financingId: 1 });
repaymentSchema.index({ invoiceId: 1 });
repaymentSchema.index({ businessId: 1 });
repaymentSchema.index({ status: 1 });
repaymentSchema.index({ dueDate: 1 });
repaymentSchema.index({ nextDueDate: 1 });
repaymentSchema.index({ submittedAmount: 1 });

const Repayment = mongoose.model<IRepayment>("Repayment", repaymentSchema);

export default Repayment;
