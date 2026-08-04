import { Document, Types } from "mongoose";

export interface IVerification extends Document {
  invoiceId: Types.ObjectId;
  verifiedBy: Types.ObjectId;
  result: "approved" | "rejected" | "requires_correction";
  remarks: string;
  checks: {
    duplicateCheck: boolean;
    mandatoryDocuments: boolean;
    invoiceValidity: boolean;
    buyerInformation: boolean;
    amountValidation: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
