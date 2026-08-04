import RepaymentSchedule from "../models/RepaymentSchedule";
import { IRepaymentSchedule } from "../interface/IRepaymentSchedule";

class RepaymentScheduleRepository {
  async createMany(schedules: Partial<IRepaymentSchedule>[], session?: any) {
    if (session) {
      return await RepaymentSchedule.insertMany(schedules, { session });
    }
    return await RepaymentSchedule.insertMany(schedules);
  }

  async getByRepayment(
    repaymentId: string,
    page: number = 1,
    limit: number = 12,
    status?: string
  ) {
    const skip = (page - 1) * limit;
    const query: Record<string, any> = { repaymentId };
    if (status) query.status = status;

    const total = await RepaymentSchedule.countDocuments(query);
    const installments = await RepaymentSchedule.find(query)
      .sort({ installmentNumber: 1 })
      .skip(skip)
      .limit(limit);

    return { installments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getByRepaymentAll(repaymentId: string) {
    return await RepaymentSchedule.find({ repaymentId }).sort({
      installmentNumber: 1,
    });
  }

  async getCurrentInstallment(repaymentId: string) {
    return await RepaymentSchedule.findOne({
      repaymentId,
      status: { $in: ["pending", "overdue"] },
    }).sort({ installmentNumber: 1 });
  }

  async getRemainingInstallments(repaymentId: string) {
    return await RepaymentSchedule.find({
      repaymentId,
      status: { $in: ["pending", "overdue"] },
    }).sort({ installmentNumber: 1 });
  }

  async getOverdueInstallments(repaymentId: string) {
    return await RepaymentSchedule.find({
      repaymentId,
      status: "overdue",
    }).sort({ installmentNumber: 1 });
  }

  async markInstallmentsPaid(
    repaymentId: string,
    installmentNumbers: number[],
    updateData: Partial<IRepaymentSchedule>,
    session?: any
  ) {
    return await RepaymentSchedule.updateMany(
      { repaymentId, installmentNumber: { $in: installmentNumbers } },
      { $set: { ...updateData, status: "paid" } },
      session ? { session } : undefined
    );
  }

  async markInstallmentsPrepaid(
    repaymentId: string,
    installmentNumbers: number[],
    updateData: Partial<IRepaymentSchedule>,
    session?: any
  ) {
    return await RepaymentSchedule.updateMany(
      { repaymentId, installmentNumber: { $in: installmentNumbers } },
      { $set: { ...updateData, status: "prepaid" } },
      session ? { session } : undefined
    );
  }

  async applyPayment(
    repaymentId: string,
    installments: {
      installmentNumber: number;
      paidAmount: number;
      status: "paid" | "prepaid";
      lateFeePaid: boolean;
    }[],
    common: Partial<IRepaymentSchedule>,
    session?: any
  ) {
    const operations = installments.map((inst) => ({
      updateOne: {
        filter: { repaymentId, installmentNumber: inst.installmentNumber },
        update: {
          $set: {
            ...common,
            status: inst.status,
            paidAmount: inst.paidAmount,
            lateFeePaid: inst.lateFeePaid,
          },
        },
      },
    }));

    if (operations.length === 0) return null;

    return await RepaymentSchedule.bulkWrite(
      operations,
      session ? { session } : undefined
    );
  }

  async countByRepayment(repaymentId: string, status: string) {
    return await RepaymentSchedule.countDocuments({ repaymentId, status } as any);
  }

  async markOverdue(
    before: Date,
    lateFeeAmounts: Map<string, number>
  ) {
    const installmentIds = Array.from(lateFeeAmounts.keys());
    const operations: any[] = installmentIds.map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            status: "overdue",
            lateFee: lateFeeAmounts.get(id) || 0,
          },
        },
      },
    }));

    if (operations.length > 0) {
      await RepaymentSchedule.bulkWrite(operations);
    }

    return await RepaymentSchedule.updateMany(
      {
        dueDate: { $lt: before },
        status: "pending",
      },
      { $set: { status: "overdue", lateFee: 0 } }
    );
  }

  async getDueForReminder(
    fromDate: Date,
    toDate: Date,
    statuses: string[] = ["pending", "overdue"]
  ) {
    return await RepaymentSchedule.find({
      status: { $in: statuses },
      dueDate: { $gte: fromDate, $lte: toDate },
    } as any)
      .populate("businessId", "fullName email companyName")
      .populate("repaymentId", "disbursedAmount")
      .sort({ dueDate: 1 })
      .lean();
  }

  async getOverdueForSweep(before: Date) {
    return await RepaymentSchedule.find({
      status: "pending",
      dueDate: { $lt: before },
    })
      .select("_id repaymentId dueDate emiAmount")
      .lean();
  }

  async deleteByRepayment(repaymentId: string, session?: any) {
    return await RepaymentSchedule.deleteMany(
      { repaymentId },
      session ? { session } : undefined
    );
  }

  async getCountForAdminStats() {
    const [overdueAgg] = await RepaymentSchedule.aggregate([
      { $match: { status: "overdue" } },
      {
        $group: {
          _id: null,
          overdueInstallments: { $sum: 1 },
          overdueEmiAmount: {
            $sum: { $add: ["$emiAmount", { $ifNull: ["$lateFee", 0] }] },
          },
        },
      },
    ]);

    return {
      overdueInstallments: overdueAgg ? overdueAgg.overdueInstallments : 0,
      overdueAmount: overdueAgg ? overdueAgg.overdueEmiAmount : 0,
    };
  }
}

export default new RepaymentScheduleRepository();
