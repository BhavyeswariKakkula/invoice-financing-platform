import FinancingRequest from "../models/FinancingRequest";
import { IFinancingRequest } from "../interface/IFinancingRequest";

class FinancingRequestRepository {
  async createRequest(data: Partial<IFinancingRequest>) {
    return await FinancingRequest.create(data);
  }

  async findById(id: string) {
    return await FinancingRequest.findById(id);
  }

  async findByInvoiceId(invoiceId: string) {
    return await FinancingRequest.findOne({ invoiceId });
  }

  async findByInvoiceAndUser(invoiceId: string, userId: string) {
    return await FinancingRequest.findOne({ invoiceId, userId });
  }

  async updateById(id: string, updateData: Partial<IFinancingRequest>, session?: any) {
    return await FinancingRequest.findByIdAndUpdate(id, updateData, {
      new: true,
      session: session || undefined,
    });
  }

  async findByUser(
    userId: string,
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const query = { userId, ...filter };
    const total = await FinancingRequest.countDocuments(query);
    const requests = await FinancingRequest.find(query)
      .populate("invoiceId", "invoiceNumber totalAmount buyerCompany")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { requests, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const total = await FinancingRequest.countDocuments(filter);
    const requests = await FinancingRequest.find(filter)
      .populate("userId", "fullName email companyName")
      .populate("invoiceId", "invoiceNumber totalAmount buyerCompany")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { requests, total, page, totalPages: Math.ceil(total / limit) };
  }

  async countByStatus(status: string) {
    return await FinancingRequest.countDocuments({ status } as any);
  }

  async sumApprovedAmount() {
    const result = await FinancingRequest.aggregate([
      { $match: { status: { $in: ["approved", "disbursed", "repayment", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getMonthlyFinancing() {
    return await FinancingRequest.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$approvedAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);
  }
}

export default new FinancingRequestRepository();
