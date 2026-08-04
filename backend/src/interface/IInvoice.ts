import { Document, Types } from "mongoose";

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  buyerName: string;
  buyerCompany: string;
  invoiceAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  invoiceFile?: string;
  status:
    | "draft"
    | "submitted"
    | "under_verification"
    | "verified"
    | "rejected"
    | "requires_correction"
    | "financed"
    | "closed";
  verificationRemarks?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
