import { Document, Types } from "mongoose";

export type RepaymentScheduleStatus = "pending" | "paid" | "overdue" | "prepaid";

export interface IRepaymentSchedule extends Document {
  repaymentId: Types.ObjectId;
  financingId: Types.ObjectId;
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  installmentNumber: number;
  totalInstallments: number;
  openingBalance: number;
  principalAmount: number;
  interestAmount: number;
  emiAmount: number;
  closingBalance: number;
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  status: RepaymentScheduleStatus;
  paymentMethod?: "bank_transfer" | "upi" | "cash" | "other";
  transactionId?: string;
  paymentProof?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  remarks?: string;
  rejectedReason?: string;
  lateFee?: number;
  lateFeePaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
