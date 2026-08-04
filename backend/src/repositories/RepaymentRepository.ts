import Repayment from "../models/Repayment";
import { IRepayment } from "../interface/IRepayment";

class RepaymentRepository {
  async createRepayment(data: Partial<IRepayment>, session?: any) {
    if (session) {
      const repayment = new Repayment(data);
      repayment.$session(session);
      return await repayment.save();
    }
    return await Repayment.create(data);
  }

  async getRepaymentById(id: string) {
    return await Repayment.findById(id)
      .populate("financingId", "invoiceId approvedAmount interestRate tenureMonths processingFee")
      .populate("invoiceId", "invoiceNumber totalAmount buyerCompany")
      .populate("businessId", "fullName email companyName");
  }

  async findByFinancing(financingId: string) {
    return await Repayment.findOne({ financingId });
  }

  async getRepaymentsByBusiness(
    businessId: string,
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const query = { businessId, ...filter };
    const total = await Repayment.countDocuments(query);
    const repayments = await Repayment.find(query)
      .populate("financingId", "invoiceId approvedAmount")
      .populate("invoiceId", "invoiceNumber totalAmount buyerCompany")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { repayments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAllRepayments(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const skip = (page - 1) * limit;
    const total = await Repayment.countDocuments(filter);
    const repayments = await Repayment.find(filter)
      .populate("businessId", "fullName email companyName")
      .populate("financingId", "invoiceId approvedAmount")
      .populate("invoiceId", "invoiceNumber totalAmount buyerCompany")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);
    return { repayments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateRepayment(id: string, updateData: Partial<IRepayment>, session?: any) {
    return await Repayment.findByIdAndUpdate(id, updateData, {
      new: true,
      session: session || undefined,
    });
  }

  async verifyRepayment(id: string, updateData: Partial<IRepayment>) {
    return await this.updateRepayment(id, updateData);
  }

  async rejectRepayment(id: string, updateData: Partial<IRepayment>) {
    return await this.updateRepayment(id, updateData);
  }

  async markOverdueRepayments(before: Date) {
    return await Repayment.updateMany(
      {
        status: "active",
        nextDueDate: { $lt: before },
      },
      { $set: { status: "overdue" } }
    );
  }

  async countByStatus(status: string) {
    return await Repayment.countDocuments({ status } as any);
  }

  async countDocuments(filter: Record<string, any> = {}) {
    return await Repayment.countDocuments(filter);
  }

  async getTotalPaidAmount(userId?: string) {
    const match: Record<string, any> = {
      status: { $in: ["active", "overdue", "completed", "prepaid"] },
    };
    if (userId) match.businessId = userId;
    const result = await Repayment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getTotalOutstanding(userId?: string) {
    const match: Record<string, any> = {
      status: { $in: ["active", "overdue"] },
    };
    if (userId) match.businessId = userId;
    const result = await Repayment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$remainingAmount" } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getBusinessRepaymentSummary(businessId: string) {
    const match: Record<string, any> = {
      businessId: businessId as any,
      status: { $in: ["active", "overdue"] },
    };

    const repayments = await Repayment.find(match);

    console.log("Business ID:", businessId);
    console.log("Match:", match);
    console.log("Repayments Found:", repayments.length);
    console.log("Repayments:", repayments);

const summary = {
  count: repayments.length,
  loanAmount: repayments.reduce((sum, r) => sum + (r.disbursedAmount || 0), 0),
  outstandingPrincipal: repayments.reduce(
    (sum, r) => sum + (r.outstandingPrincipal || 0),
    0
  ),
  totalInterest: repayments.reduce(
    (sum, r) => sum + (r.totalInterest || 0),
    0
  ),
  interestCollected: repayments.reduce(
    (sum, r) => sum + (r.interestCollected || 0),
    0
  ),
  interestRemaining: repayments.reduce(
    (sum, r) => sum + (r.outstandingInterest || 0),
    0
  ),
  amountPaid: repayments.reduce(
    (sum, r) => sum + (r.amountPaid || 0),
    0
  ),
  emisPaid: repayments.reduce(
    (sum, r) => sum + (r.emisPaid || 0),
    0
  ),
  totalInstallments: repayments.reduce(
    (sum, r) => sum + (r.totalInstallments || 0),
    0
  ),
  overdue: repayments.filter(r => r.status === "overdue").length,
};

const nextLoan = await Repayment.findOne(match).sort({ nextDueDate: 1 });
    const currentEmi = nextLoan ? nextLoan.emiAmount : 0;
    const emisRemaining =
  (summary.totalInstallments || 0) - (summary.emisPaid || 0);

    const loanProgressPercent =
  (summary.totalInstallments || 0) > 0
    ? Math.round(
        ((summary.emisPaid || 0) / summary.totalInstallments) * 100
      )
    : 0;

    return {
      ...summary,
      activeLoans: summary.count,
      currentEmi,
      emisRemaining,
      loanProgressPercent,
      nextDueDate: nextLoan ? nextLoan.nextDueDate : null,
      hasPendingPayment: nextLoan ? (nextLoan.submittedAmount || 0) > 0 : false,
    };
  }

  async getAdminLoanStats() {
    const [aggregation] = await Repayment.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          activeLoans: {
            $sum: { $cond: [{ $in: ["$status", ["active", "overdue"]] }, 1, 0] },
          },
          completedLoans: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          prepaidLoans: {
            $sum: { $cond: [{ $eq: ["$status", "prepaid"] }, 1, 0] },
          },
          overdueLoans: {
            $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
          },
          totalDisbursed: { $sum: "$disbursedAmount" },
          outstandingPrincipal: { $sum: "$outstandingPrincipal" },
          interestEarned: { $sum: "$interestCollected" },
          lateFeeEarned: { $sum: "$lateFeeCollected" },
          totalCollected: { $sum: "$amountPaid" },
        },
      },
    ]);

    return aggregation || {
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      prepaidLoans: 0,
      overdueLoans: 0,
      totalDisbursed: 0,
      outstandingPrincipal: 0,
      interestEarned: 0,
      lateFeeEarned: 0,
      totalCollected: 0,
    };
  }

  async getRepaymentsForReport(filter: Record<string, any>) {
    return await Repayment.find(filter)
      .populate("businessId", "fullName email companyName")
      .populate("invoiceId", "invoiceNumber totalAmount")
      .populate("financingId", "requestedAmount approvedAmount")
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default new RepaymentRepository();
