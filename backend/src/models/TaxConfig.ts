import mongoose, { Schema } from "mongoose";
import { ITaxConfig } from "../interface/ITaxConfig";

const taxConfigSchema = new Schema<ITaxConfig>(
  {
    taxName: {
      type: String,
      required: true,
      trim: true,
    },
    taxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaxConfig = mongoose.model<ITaxConfig>("TaxConfig", taxConfigSchema);

export default TaxConfig;
