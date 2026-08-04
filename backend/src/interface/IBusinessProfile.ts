import { Document, Types } from "mongoose";

export interface IBusinessProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  businessCategory: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationRemarks?: string;
  documents: {
    name: string;
    url: string;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
