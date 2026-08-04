import { emailQueue, notificationQueue, repaymentReminderQueue } from "../queues";
import RepaymentScheduleRepository from "../repositories/RepaymentScheduleRepository";
import RepaymentService from "../services/RepaymentService";
import repaymentConfig from "../config/repaymentConfig";

export const sendEmailJob = async (
  to: string,
  subject: string,
  html: string
) => {
  await emailQueue.add("send-email", { to, subject, html }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
};

export const sendNotificationJob = async (
  userId: string,
  title: string,
  message: string,
  category: string,
  relatedId?: string,
  relatedModel?: string
) => {
  await notificationQueue.add("send-notification", {
    userId,
    title,
    message,
    category,
    relatedId,
    relatedModel,
  }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });
};

export const sendRepaymentReminderJob = async (
  userId: string,
  repaymentId: string,
  installmentNumber: number,
  dueDate: Date,
  amount: number,
  email: string,
  fullName: string
) => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const jobId = `repayment-reminder-${repaymentId}-${installmentNumber}-${dateKey}`;

  await repaymentReminderQueue.add("send-reminder", {
    userId,
    repaymentId,
    installmentNumber,
    dueDate,
    amount,
    email,
    fullName,
  }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    jobId,
  });
};

export const scheduleRepaymentReminders = async (
  reminderWindowDays: number = repaymentConfig.reminderDays
): Promise<number> => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - reminderWindowDays);
  const to = new Date(now);
  to.setDate(now.getDate() + reminderWindowDays);

  const installments = await RepaymentScheduleRepository.getDueForReminder(
    from,
    to,
    ["pending", "overdue"]
  );

  let scheduled = 0;

  for (const installment of installments) {
    const business = (installment as any).businessId as any;
    const repaymentRef = (installment as any).repaymentId as any;
    const repaymentId = repaymentRef?._id
      ? repaymentRef._id.toString()
      : installment.repaymentId.toString();

    if (!business || !business._id || !business.email) {
      continue;
    }

    try {
      await sendRepaymentReminderJob(
        business._id.toString(),
        repaymentId,
        installment.installmentNumber,
        installment.dueDate,
        installment.emiAmount + (installment.lateFee || 0),
        business.email,
        business.fullName || business.companyName || "there"
      );
      scheduled += 1;
    } catch (error: any) {
      if (error?.message?.includes("already exists")) {
        continue;
      }
      console.error(
        `Failed to enqueue reminder for installment ${installment._id}:`,
        error?.message
      );
    }
  }

  return scheduled;
};

export const processOverdueRepayments = async (): Promise<{
  installmentsMarkedOverdue: number;
  loansMarkedOverdue: number;
}> => {
  const result = await RepaymentService.processOverdue();
  return {
    installmentsMarkedOverdue: result.installmentsMarkedOverdue,
    loansMarkedOverdue: result.loansMarkedOverdue,
  };
};
