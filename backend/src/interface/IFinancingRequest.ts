import { Document, Types } from "mongoose";

export type FinancingRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed"
  | "repayment"
  | "completed";

export interface IFinancingRequest extends Document {
  invoiceId: Types.ObjectId;
  userId: Types.ObjectId;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate: number;
  tenureMonths: number;
  processingFee: number;
  status: FinancingRequestStatus;
  remarks?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  disbursedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
