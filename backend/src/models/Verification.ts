import mongoose, { Schema } from "mongoose";
import { IVerification } from "../interface/IVerification";

const verificationSchema = new Schema<IVerification>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    result: {
      type: String,
      enum: ["approved", "rejected", "requires_correction"],
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    checks: {
      duplicateCheck: { type: Boolean, default: false },
      mandatoryDocuments: { type: Boolean, default: false },
      invoiceValidity: { type: Boolean, default: false },
      buyerInformation: { type: Boolean, default: false },
      amountValidation: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ invoiceId: 1 });
verificationSchema.index({ verifiedBy: 1 });
verificationSchema.index({ result: 1 });

const Verification = mongoose.model<IVerification>(
  "Verification",
  verificationSchema
);

export default Verification;
