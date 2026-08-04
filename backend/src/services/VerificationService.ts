import VerificationRepository from "../repositories/VerificationRepository";
import InvoiceRepository from "../repositories/InvoiceRepository";
import { IVerification } from "../interface/IVerification";
import { AppError } from "../middleware/errorHandler";
import emailService from "./EmailService";
import UserRepository from "../repositories/UserRepository";
import { cacheService } from "./RedisService";
import notificationService from "./NotificationService";

class VerificationService {
  async verifyInvoice(
    invoiceId: string,
    adminId: string,
    result: "approved" | "rejected" | "requires_correction",
    remarks: string = "",
    checks?: Partial<IVerification["checks"]>
  ) {
    const invoice = await InvoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status !== "submitted") {
      throw new AppError("Invoice is not in submitted status", 400);
    }

    const verification = await VerificationRepository.createVerification({
      invoiceId: invoiceId as any,
      verifiedBy: adminId as any,
      result,
      remarks,
      checks: {
        duplicateCheck: checks?.duplicateCheck ?? true,
        mandatoryDocuments: checks?.mandatoryDocuments ?? true,
        invoiceValidity: checks?.invoiceValidity ?? true,
        buyerInformation: checks?.buyerInformation ?? true,
        amountValidation: checks?.amountValidation ?? true,
      },
    });

    let newStatus: string;
    if (result === "approved") {
      newStatus = "verified";
    } else if (result === "rejected") {
      newStatus = "rejected";
    } else {
      newStatus = "requires_correction";
    }

    await InvoiceRepository.updateById(invoiceId, {
      status: newStatus as any,
      verificationRemarks: remarks,
      verifiedBy: adminId as any,
      verifiedAt: new Date(),
    } as any);

    try {
      await notificationService.sendInvoiceVerifiedNotification(
        invoice.userId.toString(),
        invoice.invoiceNumber,
        invoiceId,
        newStatus
      );
    } catch (e) {
      console.error("Failed to create invoice verified notification:", e);
    }

    const user = await UserRepository.findById(invoice.userId.toString());
    if (user) {
      try {
        await emailService.sendVerificationStatusEmail(
          user.email,
          user.fullName,
          invoice.invoiceNumber,
          newStatus
        );
      } catch (e) {
        console.error("Failed to send verification email:", e);
      }
    }

    await cacheService.del(`invoices:${invoice.userId.toString()}`);
    await cacheService.del(`dashboard:${invoice.userId.toString()}`);
    await cacheService.del(`dashboard:admin`);

    return verification;
  }

  async getVerificationByInvoice(invoiceId: string) {
    return await VerificationRepository.findAllByInvoice(invoiceId);
  }

  async getAllVerifications(page: number = 1, limit: number = 10, result?: string) {
    const filter: Record<string, any> = {};
    if (result) filter.result = result;

    return await VerificationRepository.findAll(filter, page, limit);
  }

  async getVerificationStats() {
    const approved = await VerificationRepository.countByResult("approved");
    const rejected = await VerificationRepository.countByResult("rejected");
    const requiresCorrection = await VerificationRepository.countByResult("requires_correction");
    const avgTime = await VerificationRepository.getAverageVerificationTime();

    return {
      approved,
      rejected,
      requiresCorrection,
      averageVerificationTime: Math.round(avgTime / (1000 * 60 * 60) * 10) / 10,
    };
  }
}

export default new VerificationService();
