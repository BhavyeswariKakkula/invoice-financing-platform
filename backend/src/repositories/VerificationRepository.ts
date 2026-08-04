import Verification from "../models/Verification";
import { IVerification } from "../interface/IVerification";

class VerificationRepository {
  async createVerification(data: Partial<IVerification>) {
    return await Verification.create(data);
  }

  async findByInvoiceId(invoiceId: string) {
    return await Verification.findOne({ invoiceId }).sort({ createdAt: -1 });
  }

  async findAllByInvoice(invoiceId: string) {
    return await Verification.find({ invoiceId })
      .populate("verifiedBy", "fullName email")
      .sort({ createdAt: -1 });
  }

  async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const total = await Verification.countDocuments(filter);
    const verifications = await Verification.find(filter)
      .populate("invoiceId", "invoiceNumber invoiceAmount buyerCompany")
      .populate("verifiedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { verifications, total, page, totalPages: Math.ceil(total / limit) };
  }

  async countByResult(result: string) {
    return await Verification.countDocuments({ result } as any);
  }

  async getAverageVerificationTime() {
    const result = await Verification.aggregate([
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      { $unwind: "$invoice" },
      {
        $project: {
          diff: {
            $subtract: ["$createdAt", "$invoice.submittedAt"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$diff" },
        },
      },
    ]);
    return result.length > 0 ? result[0].avgTime : 0;
  }
}

export default new VerificationRepository();
