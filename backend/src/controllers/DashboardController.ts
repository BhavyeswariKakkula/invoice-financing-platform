import { Response } from "express";
import InvoiceRepository from "../repositories/InvoiceRepository";
import FinancingRequestRepository from "../repositories/FinancingRequestRepository";
import RepaymentRepository from "../repositories/RepaymentRepository";
import BusinessProfileRepository from "../repositories/BusinessProfileRepository";
import VerificationService from "../services/VerificationService";
import { AuthRequest } from "../middleware/auth";
import { cacheService } from "../services/RedisService";

class DashboardController {
  async getBusinessDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const cacheKey = `dashboard:${userId}`;

      const cached = await cacheService.getObject(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const totalInvoices = await InvoiceRepository.countByUser(userId);
      const pendingVerification = await InvoiceRepository.countByStatus("submitted") +
        await InvoiceRepository.countByStatus("under_verification");
      const verifiedInvoices = await InvoiceRepository.countByStatus("verified");
      const financedInvoices = await InvoiceRepository.countByStatus("financed");
      const totalFinanced = await InvoiceRepository.sumByUser(userId, "financed");
      const totalOutstanding = await RepaymentRepository.getTotalOutstanding(userId);
      const totalPaid = await RepaymentRepository.getTotalPaidAmount(userId);

      const statusDistribution = await InvoiceRepository.getStatusDistribution(userId);
      const monthlyFinancing = await InvoiceRepository.getMonthlyFinancing(userId);

      const activeLoans = await RepaymentRepository.countDocuments({
        status: "active",
        businessId: userId,
      } as any);
      const overdueLoans = await RepaymentRepository.countDocuments({
        status: "overdue",
        businessId: userId,
      } as any);
      const pendingVerificationPayments = await RepaymentRepository.countDocuments({
        submittedAmount: { $gt: 0 },
        businessId: userId,
      } as any);
      const repaymentSummary = await RepaymentRepository.getBusinessRepaymentSummary(userId);

      const dashboardData = {
        cards: {
          totalInvoices,
          pendingVerification,
          verifiedInvoices,
          financedInvoices,
          totalFinanced,
          totalOutstanding,
          totalPaid,
          activeLoans,
          overdueLoans,
          pendingVerificationPayments,
          loanAmount: repaymentSummary.loanAmount,
          outstandingPrincipal: repaymentSummary.outstandingPrincipal,
          interestRemaining: repaymentSummary.interestRemaining,
          repaymentAmountPaid: repaymentSummary.amountPaid,
          activeLoanCount: repaymentSummary.activeLoans,
          currentEmi: repaymentSummary.currentEmi,
          nextRepaymentDueDate: repaymentSummary.nextDueDate,
          emisPaid: repaymentSummary.emisPaid,
totalInstallments: repaymentSummary.totalInstallments,
emisRemaining: repaymentSummary.emisRemaining,
          loanProgressPercent: repaymentSummary.loanProgressPercent,
          hasPendingPayment: repaymentSummary.hasPendingPayment,
        },
        charts: {
          statusDistribution,
          monthlyFinancing,
        },
      };

      await cacheService.setObject(cacheKey, dashboardData, 300);

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAdminDashboard(req: AuthRequest, res: Response) {
    try {
      const cacheKey = "dashboard:admin";

      const cached = await cacheService.getObject(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const totalBusinesses = await BusinessProfileRepository.countDocuments();
      const pendingVerifications = await InvoiceRepository.countByStatus("submitted");
      const underVerification = await InvoiceRepository.countByStatus("under_verification");
      const totalInvoices = await InvoiceRepository.countDocuments();
      const approvedFinancing = await FinancingRequestRepository.countByStatus("approved");
      const rejectedFinancing = await FinancingRequestRepository.countByStatus("rejected");
      const pendingVerificationPayments = await RepaymentRepository.countDocuments({
        submittedAmount: { $gt: 0 },
      } as any);
      const totalFinancedAmount = await FinancingRequestRepository.sumApprovedAmount();
      const loanStats = await RepaymentRepository.getAdminLoanStats();

      const monthlyFinancing = await FinancingRequestRepository.getMonthlyFinancing();
      const verificationStats = await VerificationService.getVerificationStats();
      const invoiceStatusDistribution = await InvoiceRepository.getStatusDistribution();

      const dashboardData = {
        cards: {
          totalBusinesses,
          pendingVerifications,
          underVerification,
          totalInvoices,
          approvedFinancing,
          rejectedFinancing,
          activeRepayments: loanStats.activeLoans,
          totalFinancedAmount,
          totalPaidAmount: loanStats.totalCollected,
          totalOutstanding: loanStats.outstandingPrincipal,
          totalLoans: loanStats.totalLoans,
          activeLoans: loanStats.activeLoans,
          completedLoans: loanStats.completedLoans,
          prepaidLoans: loanStats.prepaidLoans,
          overdueLoans: loanStats.overdueLoans,
          outstandingPrincipal: loanStats.outstandingPrincipal,
          interestEarned: loanStats.interestEarned,
          lateFeeEarned: loanStats.lateFeeEarned,
          pendingVerificationPayments,
        },
        charts: {
          monthlyFinancing,
          verificationStats,
          invoiceStatusDistribution,
        },
      };

      await cacheService.setObject(cacheKey, dashboardData, 300);

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new DashboardController();
