import mongoose from "mongoose";
import RepaymentRepository from "../repositories/RepaymentRepository";
import RepaymentScheduleRepository from "../repositories/RepaymentScheduleRepository";
import FinancingRequestRepository from "../repositories/FinancingRequestRepository";
import InvoiceRepository from "../repositories/InvoiceRepository";
import InvoiceModel from "../models/Invoice";
import { AppError } from "../middleware/errorHandler";
import { cacheService } from "./RedisService";
import notificationService from "./NotificationService";
import repaymentConfig from "../config/repaymentConfig";
import {
  generateAmortizationSchedule,
  calculateAccruedInterest,
  calculateLateFee,
  calculateTotalInterest,
  roundMoney,
  overdueDays,
  sumInstallments,
  AmortizationInstallment,
} from "../utils/amortization";

class RepaymentService {
  async createRepaymentForFinancing(financingRequestId: string) {
    const financingRequest = await FinancingRequestRepository.findById(
      financingRequestId
    );

    if (!financingRequest) {
      throw new AppError("Financing request not found", 404);
    }

    if (financingRequest.status !== "disbursed") {
      throw new AppError("Repayment can only be created after disbursement", 400);
    }

    const existing = await RepaymentRepository.findByFinancing(
      financingRequestId
    );
    if (existing) {
      return existing;
    }

    const principal = financingRequest.approvedAmount || financingRequest.requestedAmount;
    const annualInterestRate = financingRequest.interestRate || 0;
    const tenureMonths = financingRequest.tenureMonths;
    const processingFee = financingRequest.processingFee || 0;

    const schedule = generateAmortizationSchedule(
      principal,
      annualInterestRate,
      tenureMonths
    );

    const totalInterest = roundMoney(
      schedule.reduce((acc, i) => acc + i.interestAmount, 0)
    );
    const totalPayable = roundMoney(principal + totalInterest + processingFee);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const repayment = await RepaymentRepository.createRepayment(
        {
          financingId: financingRequestId as any,
          invoiceId: financingRequest.invoiceId as any,
          businessId: financingRequest.userId as any,
          disbursedAmount: principal,
          annualInterestRate,
          tenureMonths,
          emiAmount: schedule.length > 0 ? schedule[0].emiAmount : 0,
          interestAmount: totalInterest,
          totalInterest,
          totalPayable,
          amountPaid: 0,
          principalPaid: 0,
          interestCollected: 0,
          lateFeeCollected: 0,
          outstandingPrincipal: principal,
          outstandingInterest: totalInterest,
          remainingAmount: totalPayable - processingFee,
          totalInstallments: tenureMonths,
          emisPaid: 0,
          currentInstallmentNumber: 1,
          nextDueDate: schedule.length > 0 ? schedule[0].dueDate : undefined,
          submittedAmount: 0,
          dueDate: schedule.length > 0 ? schedule[0].dueDate : new Date(),
          status: "active",
        },
        session
      );

      await RepaymentScheduleRepository.createMany(
        schedule.map((i: AmortizationInstallment) => ({
          repaymentId: repayment._id as any,
          financingId: financingRequestId as any,
          businessId: financingRequest.userId as any,
          invoiceId: financingRequest.invoiceId as any,
          installmentNumber: i.installmentNumber,
          totalInstallments: i.totalInstallments,
          openingBalance: i.openingBalance,
          principalAmount: i.principalAmount,
          interestAmount: i.interestAmount,
          emiAmount: i.emiAmount,
          closingBalance: i.closingBalance,
          dueDate: i.dueDate,
          status: "pending",
          lateFee: 0,
          lateFeePaid: false,
        })),
        session
      );

      const financingId =
  typeof repayment.financingId === "object" &&
  repayment.financingId !== null &&
  "_id" in repayment.financingId
    ? repayment.financingId._id.toString()
    : repayment.financingId.toString();

await FinancingRequestRepository.updateById(
  financingId,
  { status: "completed" } as any,
  session
);

      await session.commitTransaction();

      await cacheService.del(`dashboard:${financingRequest.userId.toString()}`);
      await cacheService.del(`dashboard:admin`);

      return repayment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getRepaymentById(
    repaymentId: string,
    businessId?: string,
    isAdmin: boolean = false
  ) {
    const repayment = await RepaymentRepository.getRepaymentById(repaymentId);

    if (!repayment) {
      throw new AppError("Repayment not found", 404);
    }

    if (
  !isAdmin &&
  businessId &&
  repayment.businessId._id.toString() !== businessId
) {
  throw new AppError("Access denied", 403);
}

    return repayment;
  }

  async getSchedule(
    repaymentId: string,
    businessId?: string,
    isAdmin: boolean = false,
    page: number = 1,
    limit: number = 12,
    status?: string
  ) {
    await this.getRepaymentById(repaymentId, businessId, isAdmin);

    const result = await RepaymentScheduleRepository.getByRepayment(
      repaymentId,
      page,
      limit,
      status
    );

    return {
      ...result,
      schedule: result.installments,
    };
  }

  async getMyRepayments(
    businessId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ) {
    const filter: Record<string, any> = {};
    if (status) {
      if (status === "pending_verification") {
        filter.submittedAmount = { $gt: 0 };
      } else {
        filter.status = status;
      }
    }
    if (search) {
      filter.$or = await this.buildSearchFilter(search);
    }

    return await RepaymentRepository.getRepaymentsByBusiness(
      businessId,
      filter,
      page,
      limit
    );
  }

  async getAllRepayments(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const filter: Record<string, any> = {};
    if (status) {
      if (status === "pending_verification") {
        filter.submittedAmount = { $gt: 0 };
      } else {
        filter.status = status;
      }
    }
    if (search) {
      filter.$or = await this.buildSearchFilter(search);
    }

    return await RepaymentRepository.getAllRepayments(
      filter,
      page,
      limit,
      sortBy,
      sortOrder
    );
  }

  async getDashboardSummary(businessId: string) {
    return await RepaymentRepository.getBusinessRepaymentSummary(businessId);
  }

  async getAdminStats() {
    const loanStats = await RepaymentRepository.getAdminLoanStats();
    const scheduleStats =
      await RepaymentScheduleRepository.getCountForAdminStats();

    return {
      ...loanStats,
      ...scheduleStats,
    };
  }

  private async buildSearchFilter(search: string) {
    const matchingInvoices = await InvoiceModel.find({
      invoiceNumber: { $regex: search, $options: "i" },
    }).select("_id");
    const invoiceIds = matchingInvoices.map((inv) => inv._id);

    const orConditions: Record<string, any>[] = [
      { transactionId: { $regex: search, $options: "i" } },
    ];
    if (invoiceIds.length > 0) {
      orConditions.push({ invoiceId: { $in: invoiceIds } });
    }
    return orConditions;
  }

  private async buildEarlyClosureQuote(repayment: any) {
    const outstandingPrincipal = repayment.outstandingPrincipal;
    const remaining = await RepaymentScheduleRepository.getRemainingInstallments(
      repayment._id.toString()
    );

    const reference = remaining.length > 0 ? remaining[0].dueDate : repayment.createdAt;
    const accruedInterest = calculateAccruedInterest(
      outstandingPrincipal,
      repayment.annualInterestRate,
      reference,
      new Date()
    );

    const lateFees = remaining.reduce((acc, i) => acc + (i.lateFee || 0), 0);

    return {
      outstandingPrincipal,
      accruedInterest,
      lateFees,
      totalPayoff: roundMoney(outstandingPrincipal + accruedInterest + lateFees),
    };
  }

  async getEarlyClosureQuote(repaymentId: string, businessId: string) {
    const repayment = await this.getRepaymentById(repaymentId, businessId);

    if (repayment.status === "completed" || repayment.status === "prepaid") {
      throw new AppError("This loan is already closed", 400);
    }

    return await this.buildEarlyClosureQuote(repayment);
  }

  async submitPayment(
    repaymentId: string,
    businessId: string,
    data: {
      amount: number;
      paymentType?: "emi" | "prepay" | "close";
      prepayInstallments?: number;
      paymentMethod: string;
      transactionId?: string;
      paymentProof?: string;
      remarks?: string;
    }
  ) {
    const repayment = await RepaymentRepository.getRepaymentById(repaymentId);

    if (!repayment) {
      throw new AppError("Repayment not found", 404);
    }
    
    console.log("Logged in Business ID:", businessId);
console.log("Repayment Business ID:", repayment.businessId);
console.log("Repayment Business _id:", repayment.businessId._id);
console.log(
  "Comparison:",
  repayment.businessId._id.toString() === businessId
);

    if (repayment.businessId._id.toString() !== businessId) {
  throw new AppError("Access denied", 403);
}
  
console.log("✅ Passed access check");
    if (repayment.status === "completed" || repayment.status === "prepaid") {
      throw new AppError("This loan is already closed", 400);
    }

    if ((repayment.submittedAmount || 0) > 0) {
      throw new AppError("A payment is already pending verification", 400);
    }

    const paymentType = data.paymentType || "emi";
    const remaining = await RepaymentScheduleRepository.getRemainingInstallments(
      repaymentId
    );

    if (remaining.length === 0) {
      throw new AppError("No pending EMIs found for this loan", 400);
    }

    const current = remaining[0];
    let expectedAmount = 0;
    let applyCount = 1;

    switch (paymentType) {
      case "emi":
        expectedAmount = roundMoney(current.emiAmount + (current.lateFee || 0));
        applyCount = 1;
        break;

      case "prepay": {
        const k = Math.min(
          data.prepayInstallments || remaining.length,
          remaining.length
        );
        expectedAmount = sumInstallments(remaining.slice(0, k));
        applyCount = k;
        break;
      }

      case "close": {
        const quote = await this.buildEarlyClosureQuote(repayment);
        expectedAmount = quote.totalPayoff;
        applyCount = remaining.length;
        break;
      }

      default:
        throw new AppError("Invalid payment type", 400);
    }

    if (Math.abs(data.amount - expectedAmount) > repaymentConfig.amountTolerance) {
      throw new AppError(
        `Payment amount must be ₹${expectedAmount.toLocaleString("en-IN")} for "${paymentType}" payment`,
        400
      );
    }

    const updated = await RepaymentRepository.updateRepayment(repaymentId, {
      submittedAmount: data.amount,
      submittedPaymentType: paymentType,
      submittedInstallmentCount: applyCount,
      paymentMethod: data.paymentMethod as any,
      transactionId: data.transactionId,
      paymentProof: data.paymentProof,
      paymentDate: new Date(),
      submittedAt: new Date(),
      remarks: data.remarks,
      rejectionReason: undefined,
    });

    try {
      await notificationService.sendEmiSubmittedNotification(
        businessId,
        repaymentId,
        current.installmentNumber,
        data.amount
      );
    } catch (e) {
      console.error("Failed to create EMI submitted notification:", e);
    }

    await cacheService.del(`dashboard:${businessId}`);
    await cacheService.del(`dashboard:admin`);

    return updated;
  }

  async verifyPayment(repaymentId: string, adminId: string) {
    const repayment = await RepaymentRepository.getRepaymentById(repaymentId);

    if (!repayment) {
      throw new AppError("Repayment not found", 404);
    }

    if (!repayment.submittedAmount || repayment.submittedAmount <= 0) {
      throw new AppError("No payment is pending verification", 400);
    }

    const paymentType = repayment.submittedPaymentType || "emi";
    const applyCount = repayment.submittedInstallmentCount || 1;
    const remaining = await RepaymentScheduleRepository.getRemainingInstallments(
      repaymentId
    );

    if (remaining.length === 0) {
      throw new AppError("No pending EMIs found for this loan", 400);
    }

    const apply = remaining.slice(0, applyCount);
    const installmentNumbers = apply.map((i) => i.installmentNumber);

    let principalSum = 0;
    let interestSum = 0;
    let lateFeeSum = 0;
    let paidAmountSum = 0;
    let closeDiscount = false;

    const appliedInstallments = apply.map((inst) => {
      if (paymentType === "close") {
        principalSum += inst.principalAmount;
        return {
          installmentNumber: inst.installmentNumber,
          paidAmount: inst.principalAmount,
          status: "prepaid" as const,
          lateFeePaid: false,
        };
      }

      const paid = roundMoney(inst.emiAmount + (inst.lateFee || 0));
      principalSum += inst.principalAmount;
      interestSum += inst.interestAmount;
      lateFeeSum += inst.lateFee || 0;
      paidAmountSum += paid;
      return {
        installmentNumber: inst.installmentNumber,
        paidAmount: paid,
        status: "paid" as const,
        lateFeePaid: (inst.lateFee || 0) > 0,
      };
    });

    if (paymentType === "close") {
      const quote = await this.buildEarlyClosureQuote(repayment);
      interestSum = quote.accruedInterest;
      lateFeeSum = quote.lateFees;
      paidAmountSum = quote.totalPayoff;
      closeDiscount = true;
    }

    const paidAt = new Date();
    const common = {
      paidDate: paidAt,
      verifiedBy: adminId as any,
      verifiedAt: paidAt,
      paymentMethod: repayment.paymentMethod,
      transactionId: repayment.transactionId,
      paymentProof: repayment.paymentProof,
      remarks: repayment.remarks,
    };

    const session = await mongoose.startSession();
    let allPaid = false;
    try {
      session.startTransaction();

      await RepaymentScheduleRepository.applyPayment(
        repaymentId,
        appliedInstallments,
        common,
        session
      );

      allPaid = remaining.length <= apply.length;
      let summaryUpdate: Record<string, any>;

      if (paymentType === "close") {
        summaryUpdate = {
          principalPaid: repayment.disbursedAmount,
          interestCollected: roundMoney(repayment.interestCollected + interestSum),
          lateFeeCollected: roundMoney(repayment.lateFeeCollected + lateFeeSum),
          outstandingPrincipal: 0,
          outstandingInterest: roundMoney(
            Math.max(0, repayment.totalInterest - (repayment.interestCollected + interestSum))
          ),
          amountPaid: roundMoney(
            repayment.disbursedAmount +
            repayment.interestCollected +
            interestSum +
            repayment.lateFeeCollected +
            lateFeeSum
          ),
          remainingAmount: 0,
          emisPaid: repayment.totalInstallments,
          currentInstallmentNumber: repayment.totalInstallments + 1,
          nextDueDate: null,
          dueDate: paidAt,
          status: "prepaid",
          closedAt: paidAt,
        };
      } else {
        const newEmisPaid = repayment.emisPaid + apply.length;
        const principalPaid = roundMoney(repayment.principalPaid + principalSum);
        const interestCollected = roundMoney(repayment.interestCollected + interestSum);
        const lateFeeCollected = roundMoney(repayment.lateFeeCollected + lateFeeSum);
        const outstandingPrincipal = roundMoney(repayment.disbursedAmount - principalPaid);
        const outstandingInterest = roundMoney(
          Math.max(0, repayment.totalInterest - interestCollected)
        );

        summaryUpdate = {
          principalPaid,
          interestCollected,
          lateFeeCollected,
          outstandingPrincipal,
          outstandingInterest,
          amountPaid: roundMoney(principalPaid + interestCollected + lateFeeCollected),
          remainingAmount: roundMoney(outstandingPrincipal + outstandingInterest),
          emisPaid: newEmisPaid,
          currentInstallmentNumber: newEmisPaid + 1,
          nextDueDate: allPaid ? null : remaining[apply.length].dueDate,
          dueDate: allPaid ? paidAt : remaining[apply.length].dueDate,
          status: allPaid ? "completed" : "active",
          closedAt: allPaid ? paidAt : null,
        };
      }

      await RepaymentRepository.updateRepayment(
        repaymentId,
        {
          ...summaryUpdate,
          submittedAmount: 0,
          submittedPaymentType: null,
          submittedInstallmentCount: null,
          paymentMethod: null,
          transactionId: null,
          paymentProof: null,
          paymentDate: null,
          submittedAt: null,
          remarks: null,
          verifiedBy: adminId as any,
        } as any,
        session
      );
      const financingId = (repayment.financingId as any)._id
  ? String((repayment.financingId as any)._id)
  : String(repayment.financingId);

    
    const invoiceId = (repayment.invoiceId as any)._id
  ? String((repayment.invoiceId as any)._id)
  : String(repayment.invoiceId);  

      if (paymentType === "close" || allPaid) {
  await FinancingRequestRepository.updateById(
    financingId,
    { status: "completed" } as any,
    session
  );

  await InvoiceRepository.updateById(
    invoiceId,
    {
      status: "closed",
    } as any
  );
}

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    const businessId = repayment.businessId.toString();

    try {
      if (paymentType === "close") {
        await notificationService.sendLoanPrepaidNotification(
  businessId,
  financingId,
  paidAmountSum,
  closeDiscount
);
      } else if (allPaid) {
        
        
      } else {
        await notificationService.sendEmiVerifiedNotification(
          businessId,
          repaymentId,
          installmentNumbers,
          paidAmountSum
        );
      }
    } catch (e) {
      console.error("Failed to create EMI verified notification:", e);
    }

    await cacheService.del(`dashboard:${businessId}`);
    await cacheService.del(`dashboard:admin`);

    return await RepaymentRepository.getRepaymentById(repaymentId);
  }

  async rejectPayment(repaymentId: string, reason: string) {
    const repayment = await RepaymentRepository.getRepaymentById(repaymentId);

    if (!repayment) {
      throw new AppError("Repayment not found", 404);
    }

    if (!repayment.submittedAmount || repayment.submittedAmount <= 0) {
      throw new AppError("No payment is pending verification", 400);
    }

    const overdueCount = await RepaymentScheduleRepository.countByRepayment(
      repaymentId,
      "overdue"
    );

    const updated = await RepaymentRepository.updateRepayment(repaymentId, {
      submittedAmount: 0,
      submittedPaymentType: null,
      submittedInstallmentCount: null,
      paymentMethod: null,
      transactionId: null,
      paymentProof: null,
      paymentDate: null,
      submittedAt: null,
      remarks: null,
      rejectionReason: reason,
      status: overdueCount > 0 ? "overdue" : "active",
    } as any);

    try {
      await notificationService.sendEmiRejectedNotification(
        repayment.businessId.toString(),
        repaymentId,
        reason
      );
    } catch (e) {
      console.error("Failed to create EMI rejected notification:", e);
    }

    await cacheService.del(`dashboard:${repayment.businessId.toString()}`);
    await cacheService.del(`dashboard:admin`);

    return updated;
  }

  async processOverdue() {
    const now = new Date();

    const overdueInstallments =
      await RepaymentScheduleRepository.getOverdueForSweep(now);

    const lateFeeMap = new Map<string, number>();
    for (const inst of overdueInstallments) {
      const days = overdueDays(inst.dueDate, now);
      const fee = calculateLateFee(
        inst.emiAmount,
        days,
        repaymentConfig.lateFeeDailyPercent
      );
      lateFeeMap.set(inst._id.toString(), fee);
    }

    if (overdueInstallments.length > 0) {
      await RepaymentScheduleRepository.markOverdue(now, lateFeeMap);
    }

    const overdueLoans = await RepaymentRepository.markOverdueRepayments(now);

    const affectedBusinessIds = new Set<string>(
      overdueInstallments.map((i) => i.businessId?.toString()).filter(Boolean)
    );

    for (const businessId of affectedBusinessIds) {
      try {
        await notificationService.sendOverdueNotification(
          businessId,
          overdueInstallments.find((i) => i.businessId?.toString() === businessId)
            ?.repaymentId?.toString() || ""
        );
      } catch (e) {
        console.error("Failed to create overdue notification:", e);
      }
      await cacheService.del(`dashboard:${businessId}`);
    }
    await cacheService.del(`dashboard:admin`);

    return {
      installmentsMarkedOverdue: overdueInstallments.length,
      loansMarkedOverdue: overdueLoans ? overdueLoans.modifiedCount : 0,
    };
  }

  async getStats(userId?: string) {
    const scoped = (status: string) =>
      RepaymentRepository.countDocuments({
        status,
        ...(userId ? { businessId: userId } : {}),
      } as any);

    const active = await scoped("active");
    const overdue = await scoped("overdue");
    const completed = await scoped("completed");
    const prepaid = await scoped("prepaid");
    const pendingVerification = await RepaymentRepository.countDocuments({
      submittedAmount: { $gt: 0 },
      ...(userId ? { businessId: userId } : {}),
    } as any);
    const totalPaid = await RepaymentRepository.getTotalPaidAmount(userId);
    const totalOutstanding = await RepaymentRepository.getTotalOutstanding(userId);

    return {
      active,
      overdue,
      completed,
      prepaid,
      pendingVerification,
      totalPaid,
      totalOutstanding,
      pending: active,
      paid: completed,
      totalLoans: active + overdue + completed + prepaid,
    };
  }
}

export default new RepaymentService();
