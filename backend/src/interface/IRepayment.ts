import { Document, Types } from "mongoose";

export type RepaymentStatus =
  | "pending"
  | "pending_verification"
  | "partial"
  | "paid"
  | "overdue"
  | "rejected"
  | "active"
  | "completed"
  | "prepaid";

export type RepaymentPaymentType = "emi" | "prepay" | "close";

export interface IRepayment extends Document {
  financingId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  businessId: Types.ObjectId;
  disbursedAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  emiAmount: number;
  interestAmount: number;
  totalInterest: number;
  totalPayable: number;
  amountPaid: number;
  principalPaid: number;
  interestCollected: number;
  lateFeeCollected: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  remainingAmount: number;
  totalInstallments: number;
  emisPaid: number;
  currentInstallmentNumber: number;
  nextDueDate?: Date;
  submittedAmount: number;
  submittedPaymentType?: RepaymentPaymentType;
  submittedInstallmentCount?: number;
  paymentMethod?: "bank_transfer" | "upi" | "cash" | "other";
  transactionId?: string;
  paymentProof?: string;
  paymentDate?: Date;
  submittedAt?: Date;
  remarks?: string;
  rejectionReason?: string;
  closedAt?: Date;
  dueDate: Date;
  status: RepaymentStatus;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
