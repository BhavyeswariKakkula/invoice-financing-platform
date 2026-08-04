import mongoose, { Schema } from "mongoose";
import { INotification } from "../interface/INotification";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "invoice_submitted",
        "invoice_verified",
        "financing_approved",
        "repayment_completed",
        "system",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
      financingRequestId: { type: Schema.Types.ObjectId, ref: "FinancingRequest" },
      repaymentScheduleId: { type: Schema.Types.ObjectId, ref: "Repayment" },
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
