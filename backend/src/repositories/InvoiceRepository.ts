import Invoice from "../models/Invoice";
import { IInvoice } from "../interface/IInvoice";

class InvoiceRepository {
  async createInvoice(invoiceData: Partial<IInvoice>) {
    return await Invoice.create(invoiceData);
  }

  async findById(id: string) {
    return await Invoice.findById(id);
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    return await Invoice.findOne({ invoiceNumber });
  }

  async updateById(id: string, updateData: Partial<IInvoice>, session?: any) {
    return await Invoice.findByIdAndUpdate(id, updateData, {
      new: true,
      session: session || undefined,
    });
  }

  async deleteById(id: string) {
    return await Invoice.findByIdAndDelete(id);
  }

  async findByUser(
    userId: string,
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const query = { userId, ...filter };
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { invoices, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate("userId", "fullName email companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { invoices, total, page, totalPages: Math.ceil(total / limit) };
  }

  async countByStatus(status: string) {
    return await Invoice.countDocuments({ status } as any);
  }

  async countDocuments(filter: Record<string, any> = {}) {
    return await Invoice.countDocuments(filter);
  }

  async countByUser(userId: string) {
    return await Invoice.countDocuments({ userId });
  }

  async sumByUser(userId: string, status?: string) {
    const match: Record<string, any> = { userId };
    if (status) match.status = status;
    const result = await Invoice.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getStatusDistribution(userId?: string) {
    const match: Record<string, any> = {};
    if (userId) match.userId = new (require("mongoose").Types.ObjectId)(userId);
    return await Invoice.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getMonthlyFinancing(userId?: string) {
    const match: Record<string, any> = {};
    if (userId) match.userId = new (require("mongoose").Types.ObjectId)(userId);
    return await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);
  }
}

export default new InvoiceRepository();
