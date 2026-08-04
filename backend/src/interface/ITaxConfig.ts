import { Document, Types } from "mongoose";

export interface ITaxConfig extends Document {
  taxName: string;
  taxPercentage: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
