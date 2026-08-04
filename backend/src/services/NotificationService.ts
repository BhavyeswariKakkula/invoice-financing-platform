import NotificationRepository from "../repositories/NotificationRepository";
import { INotification, NotificationType } from "../interface/INotification";
import { AppError } from "../middleware/errorHandler";

class NotificationService {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: INotification["metadata"];
  }) {
    return await NotificationRepository.createNotification({
      userId: data.userId as any,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata,
    });
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    return await NotificationRepository.findByUser(userId, page, limit);
  }

  async getUnreadNotifications(userId: string) {
    return await NotificationRepository.findUnreadByUser(userId);
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await NotificationRepository.findById(notificationId);

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    return await NotificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    await NotificationRepository.markAllAsRead(userId);
    return { message: "All notifications marked as read" };
  }

  async getUnreadCount(userId: string) {
    const count = await NotificationRepository.countUnread(userId);
    return { count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await NotificationRepository.findById(notificationId);

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    await NotificationRepository.deleteById(notificationId);
    return { message: "Notification deleted" };
  }

  async sendInvoiceSubmittedNotification(userId: string, invoiceNumber: string, invoiceId: string) {
    return await this.createNotification({
      userId,
      title: "Invoice Submitted",
      message: `Your invoice ${invoiceNumber} has been submitted successfully and is pending verification.`,
      type: "invoice_submitted",
      metadata: { invoiceId: invoiceId as any },
    });
  }

  async sendInvoiceVerifiedNotification(userId: string, invoiceNumber: string, invoiceId: string, status: string) {
    return await this.createNotification({
      userId,
      title: "Invoice Verified",
      message: `Your invoice ${invoiceNumber} has been ${status}.`,
      type: "invoice_verified",
      metadata: { invoiceId: invoiceId as any },
    });
  }

  async sendFinancingApprovedNotification(userId: string, approvedAmount: number, financingRequestId: string) {
    return await this.createNotification({
      userId,
      title: "Financing Approved",
      message: `Your financing request for ₹${approvedAmount.toLocaleString("en-IN")} has been approved.`,
      type: "financing_approved",
      metadata: { financingRequestId: financingRequestId as any },
    });
  }

  async sendRepaymentCompletedNotification(userId: string, financingRequestId: string) {
    return await this.createNotification({
      userId,
      title: "Repayment Completed",
      message: `All repayments for your financing request have been completed.`,
      type: "repayment_completed",
      metadata: { financingRequestId: financingRequestId as any },
    });
  }

  async sendFinancingRejectedNotification(userId: string, requestedAmount: number, financingRequestId: string, reason?: string) {
    return await this.createNotification({
      userId,
      title: "Financing Rejected",
      message: `Your financing request for ₹${requestedAmount.toLocaleString("en-IN")} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      type: "financing_approved",
      metadata: { financingRequestId: financingRequestId as any },
    });
  }

  async sendFinancingDisbursedNotification(userId: string, amount: number, financingRequestId: string) {
    return await this.createNotification({
      userId,
      title: "Financing Disbursed",
      message: `₹${amount.toLocaleString("en-IN")} has been disbursed to your account against your financing request.`,
      type: "financing_approved",
      metadata: { financingRequestId: financingRequestId as any },
    });
  }

  async sendRepaymentSubmittedNotification(userId: string, repaymentId: string, financingRequestId: string, amount: number) {
    return await this.createNotification({
      userId,
      title: "Payment Submitted",
      message: `Your payment of ₹${amount.toLocaleString("en-IN")} has been submitted and is pending admin verification.`,
      type: "system",
      metadata: {
        financingRequestId: financingRequestId as any,
        repaymentScheduleId: repaymentId as any,
      },
    });
  }

  async sendRepaymentVerifiedNotification(userId: string, repaymentId: string, financingRequestId: string, amount: number, status: string) {
    return await this.createNotification({
      userId,
      title: "Payment Verified",
      message: `Your payment of ₹${amount.toLocaleString("en-IN")} has been verified. Repayment status is now ${status}.`,
      type: "system",
      metadata: {
        financingRequestId: financingRequestId as any,
        repaymentScheduleId: repaymentId as any,
      },
    });
  }

  async sendRepaymentRejectedNotification(userId: string, repaymentId: string, financingRequestId: string, reason: string) {
    return await this.createNotification({
      userId,
      title: "Payment Rejected",
      message: `Your payment submission was rejected. Reason: ${reason}. Please submit your payment again.`,
      type: "system",
      metadata: {
        financingRequestId: financingRequestId as any,
        repaymentScheduleId: repaymentId as any,
      },
    });
  }

  async sendEmiSubmittedNotification(userId: string, repaymentId: string, installmentNumber: number, amount: number) {
    return await this.createNotification({
      userId,
      title: "EMI Payment Submitted",
      message: `Your EMI payment of ₹${amount.toLocaleString("en-IN")} (Installment #${installmentNumber}) has been submitted and is pending admin verification.`,
      type: "system",
      metadata: {
        repaymentScheduleId: repaymentId as any,
        installmentNumber,
      },
    });
  }

  async sendEmiVerifiedNotification(userId: string, repaymentId: string, installmentNumbers: number[], amount: number) {
    return await this.createNotification({
      userId,
      title: "EMI Payment Verified",
      message: `Your EMI payment of ₹${amount.toLocaleString("en-IN")} (Installment #${installmentNumbers.join(", ")}) has been verified successfully.`,
      type: "system",
      metadata: {
        repaymentScheduleId: repaymentId as any,
        installmentNumber: installmentNumbers[0],
      },
    });
  }

  async sendEmiRejectedNotification(userId: string, repaymentId: string, reason: string) {
    return await this.createNotification({
      userId,
      title: "EMI Payment Rejected",
      message: `Your EMI payment submission was rejected. Reason: ${reason}. Please submit your payment again.`,
      type: "system",
      metadata: {
        repaymentScheduleId: repaymentId as any,
      },
    });
  }

  async sendLoanPrepaidNotification(userId: string, financingRequestId: string, amount: number, discounted: boolean) {
    return await this.createNotification({
      userId,
      title: "Loan Prepaid",
      message: `Your loan has been closed early with a payoff of ₹${amount.toLocaleString("en-IN")}.${discounted ? " Unaccrued future interest was not charged." : ""}`,
      type: "repayment_completed",
      metadata: { financingRequestId: financingRequestId as any },
    });
  }

  async sendOverdueNotification(userId: string, repaymentId: string) {
    return await this.createNotification({
      userId,
      title: "Repayment Overdue",
      message: `One or more of your EMI installments are overdue. Please make the payment at the earliest to avoid late fees.`,
      type: "system",
      metadata: { repaymentScheduleId: repaymentId as any },
    });
  }

  async sendEmiDueReminderNotification(userId: string, repaymentId: string, installmentNumber: number, dueDate: Date, amount: number, isOverdue: boolean) {
    return await this.createNotification({
      userId,
      title: isOverdue ? "EMI Overdue" : "EMI Due Soon",
      message: `Your EMI of ₹${amount.toLocaleString("en-IN")} (Installment #${installmentNumber}) is ${isOverdue ? "overdue" : `due on ${dueDate.toLocaleDateString("en-IN")}`}.`,
      type: "system",
      metadata: {
        repaymentScheduleId: repaymentId as any,
        installmentNumber,
      },
    });
  }
}

export default new NotificationService();
