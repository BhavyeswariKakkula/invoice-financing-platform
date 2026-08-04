import { Document, Types } from "mongoose";

export type NotificationType =
  | "invoice_submitted"
  | "invoice_verified"
  | "financing_approved"
  | "repayment_completed"
  | "system";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: {
    invoiceId?: Types.ObjectId;
    financingRequestId?: Types.ObjectId;
    repaymentScheduleId?: Types.ObjectId;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
