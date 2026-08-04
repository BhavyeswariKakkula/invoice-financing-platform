import FinancingRequestRepository from "../repositories/FinancingRequestRepository";
import InvoiceRepository from "../repositories/InvoiceRepository";
import BusinessProfileRepository from "../repositories/BusinessProfileRepository";
import { IFinancingRequest } from "../interface/IFinancingRequest";
import { AppError } from "../middleware/errorHandler";
import emailService from "./EmailService";
import UserRepository from "../repositories/UserRepository";
import { cacheService } from "./RedisService";
import notificationService from "./NotificationService";
import RepaymentService from "./RepaymentService";

class FinancingService {
  async applyForFinancing(
    userId: string,
    data: {
      invoiceId: string;
      requestedAmount: number;
      tenureMonths: number;
      remarks?: string;
    },
  ) {
    const profile = await BusinessProfileRepository.findByUserId(userId);
    if (!profile || profile.verificationStatus !== "verified") {
      throw new AppError(
        "Company profile must be submitted and verified before applying for financing",
        400,
      );
    }

    const invoice = await InvoiceRepository.findById(data.invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.userId.toString() !== userId) {
      throw new AppError(
        "Access denied. You can only finance your own invoices.",
        403,
      );
    }

    if (invoice.status !== "verified") {
      throw new AppError(
        "Only verified invoices are eligible for financing",
        400,
      );
    }

    if (data.requestedAmount > invoice.totalAmount) {
      throw new AppError(
        `Requested amount (₹${data.requestedAmount}) cannot exceed invoice total (₹${invoice.totalAmount})`,
        400,
      );
    }

    const existingRequest =
      await FinancingRequestRepository.findByInvoiceAndUser(
        data.invoiceId,
        userId,
      );

    if (
      existingRequest &&
      ["pending", "approved", "disbursed"].includes(existingRequest.status)
    ) {
      throw new AppError(
        "A financing request already exists for this invoice",
        400,
      );
    }

    const request = await FinancingRequestRepository.createRequest({
      userId: userId as any,
      invoiceId: data.invoiceId as any,
      requestedAmount: data.requestedAmount,
      interestRate: 0,
      tenureMonths: data.tenureMonths,
      processingFee: 0,
      remarks: data.remarks,
      status: "pending",
    });

    await cacheService.del(`dashboard:${userId}`);
    await cacheService.del(`dashboard:admin`);

    return request;
  }

  async getFinancingRequestById(
    requestId: string,
    userId?: string,
    isAdmin: boolean = false,
  ) {
    const request = await FinancingRequestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Financing request not found", 404);
    }

    if (!isAdmin && userId && request.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    return request;
  }

  async getMyFinancingRequests(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) {
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    return await FinancingRequestRepository.findByUser(
      userId,
      filter,
      page,
      limit,
    );
  }

  async getAllFinancingRequests(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) {
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    return await FinancingRequestRepository.findAll(filter, page, limit);
  }

  async approveFinancing(
    requestId: string,
    adminId: string,
    approvedAmount: number,
    interestRate: number,
    processingFee: number,
    remarks?: string,
  ) {
    const request = await FinancingRequestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Financing request not found", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("Only pending requests can be approved", 400);
    }

    if (approvedAmount > request.requestedAmount) {
      throw new AppError("Approved amount cannot exceed requested amount", 400);
    }

    const interestAmount = approvedAmount * (interestRate / 100);
    const totalRepayment = approvedAmount + interestAmount + processingFee;

    const updated = await FinancingRequestRepository.updateById(requestId, {
      status: "approved",
      approvedAmount,
      interestRate,
      processingFee,
      approvedBy: adminId as any,
      approvedAt: new Date(),
      remarks: remarks || request.remarks,
    } as any);

    if (!updated) {
      throw new AppError("Failed to update financing request", 500);
    }

    try {
      await notificationService.sendFinancingApprovedNotification(
        request.userId.toString(),
        approvedAmount,
        requestId,
      );
    } catch (e) {
      console.error("Failed to create financing approved notification:", e);
    }

    const user = await UserRepository.findById(request.userId.toString());
    if (user) {
      try {
        await emailService.sendFinancingStatusEmail(
          user.email,
          user.fullName,
          "approved",
          approvedAmount,
        );
      } catch (e) {
        console.error("Failed to send financing email:", e);
      }
    }

    await cacheService.del(`dashboard:${request.userId.toString()}`);
    await cacheService.del(`dashboard:admin`);

    const result = updated.toObject ? updated.toObject() : updated;
    return { ...result, interestAmount, totalRepayment };
  }

  async rejectFinancing(requestId: string, adminId: string, remarks?: string) {
    const request = await FinancingRequestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Financing request not found", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("Only pending requests can be rejected", 400);
    }

    const updated = await FinancingRequestRepository.updateById(requestId, {
      status: "rejected",
      approvedBy: adminId as any,
      approvedAt: new Date(),
      remarks: remarks || request.remarks,
    } as any);

    try {
      await notificationService.sendFinancingRejectedNotification(
        request.userId.toString(),
        request.requestedAmount,
        requestId,
        remarks,
      );
    } catch (e) {
      console.error("Failed to create financing rejected notification:", e);
    }

    const user = await UserRepository.findById(request.userId.toString());
    if (user) {
      try {
        await emailService.sendFinancingStatusEmail(
          user.email,
          user.fullName,
          "rejected",
          request.requestedAmount,
        );
      } catch (e) {
        console.error("Failed to send financing email:", e);
      }
    }

    await cacheService.del(`dashboard:${request.userId.toString()}`);
    await cacheService.del(`dashboard:admin`);

    return updated;
  }

  // async disburseFinancing(
  //   requestId: string,
  //   adminId: string
  // ) {
  //   const request = await FinancingRequestRepository.findById(requestId);

  //   if (!request) {
  //     throw new AppError("Financing request not found", 404);
  //   }

  //   if (request.status !== "approved") {
  //     throw new AppError("Only approved requests can be disbursed", 400);
  //   }

  //   const updated = await FinancingRequestRepository.updateById(requestId, {
  //     status: "disbursed",
  //     disbursedAt: new Date(),
  //   } as any);

  //   await InvoiceRepository.updateById(request.invoiceId.toString(), {
  //     status: "financed",
  //   } as any);

  //   try {
  //     await RepaymentService.createRepaymentForFinancing(requestId);
  //   } catch (e) {
  //     console.error("Failed to create repayment record:", e);
  //   }

  //   try {
  //     await notificationService.sendFinancingDisbursedNotification(
  //       request.userId.toString(),
  //       request.approvedAmount || request.requestedAmount,
  //       requestId
  //     );
  //   } catch (e) {
  //     console.error("Failed to create financing disbursed notification:", e);
  //   }

  //   const user = await UserRepository.findById(request.userId.toString());
  //   if (user) {
  //     try {
  //       await emailService.sendFinancingStatusEmail(
  //         user.email,
  //         user.fullName,
  //         "funded",
  //         request.approvedAmount || request.requestedAmount
  //       );
  //     } catch (e) {
  //       console.error("Failed to send financing email:", e);
  //     }
  //   }

  //   await cacheService.del(`dashboard:${request.userId.toString()}`);
  //   await cacheService.del(`dashboard:admin`);

  //   return updated;
  // }
  async disburseFinancing(requestId: string, adminId: string) {
    const request = await FinancingRequestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Financing request not found", 404);
    }

    if (request.status !== "approved") {
      throw new AppError("Only approved requests can be disbursed", 400);
    }

    const updated = await FinancingRequestRepository.updateById(requestId, {
      status: "disbursed",
      disbursedAt: new Date(),
    } as any);

    console.log("✅ Financing status updated to DISBURSED");

    await InvoiceRepository.updateById(request.invoiceId.toString(), {
      status: "financed",
    } as any);

    console.log("✅ Invoice marked as FINANCED");

    try {
      console.log("➡️ Creating repayment for:", requestId);

      const repayment =
        await RepaymentService.createRepaymentForFinancing(requestId);

      console.log("✅ Repayment created successfully");
      console.log(repayment);
    } catch (error: any) {
      console.error("❌ Failed to create repayment");
      console.error("Message:", error.message);
      console.error(error);

      // Throw the error so frontend also knows something failed
      throw error;
    }

    try {
      await notificationService.sendFinancingDisbursedNotification(
        request.userId.toString(),
        request.approvedAmount || request.requestedAmount,
        requestId,
      );
    } catch (e) {
      console.error("Notification Error:", e);
    }

    const user = await UserRepository.findById(request.userId.toString());

    if (user) {
      try {
        await emailService.sendFinancingStatusEmail(
          user.email,
          user.fullName,
          "funded",
          request.approvedAmount || request.requestedAmount,
        );
      } catch (e) {
        console.error("Email Error:", e);
      }
    }

    await cacheService.del(`dashboard:${request.userId.toString()}`);
    await cacheService.del(`dashboard:admin`);

    return updated;
  }
  async getStats(userId?: string) {
    const pending = await FinancingRequestRepository.countByStatus("pending");
    const approved = await FinancingRequestRepository.countByStatus("approved");
    const rejected = await FinancingRequestRepository.countByStatus("rejected");
    const disbursed =
      await FinancingRequestRepository.countByStatus("disbursed");
    const repayment =
      await FinancingRequestRepository.countByStatus("repayment");
    const completed =
      await FinancingRequestRepository.countByStatus("completed");
    const totalApprovedAmount =
      await FinancingRequestRepository.sumApprovedAmount();
    const monthlyFinancing =
      await FinancingRequestRepository.getMonthlyFinancing();

    return {
      pending,
      approved,
      rejected,
      disbursed,
      repayment,
      completed,
      totalApprovedAmount,
      monthlyFinancing,
    };
  }
}

export default new FinancingService();
