import { Worker, Job } from "bullmq";
import emailService from "../services/EmailService";
import NotificationService from "../services/NotificationService";
import { repaymentReminderQueue } from "../queues";
import {
  scheduleRepaymentReminders,
  processOverdueRepayments,
} from "../jobs";
import redis from "../config/redis";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
};

const emailWorker = new Worker(
  "email",
  async (job: Job) => {
    const { to, subject, html } = job.data;
    await emailService.sendEmail(to, subject, html);
    return { success: true };
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

const notificationWorker = new Worker(
  "notification",
  async (job: Job) => {
    const { userId, title, message, type, metadata } = job.data;
    await NotificationService.createNotification({
      userId,
      title,
      message,
      type: type || "system",
      metadata,
    });
    return { success: true };
  },
  { connection }
);

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

const analyticsWorker = new Worker(
  "analytics",
  async (job: Job) => {
    const { type, userId } = job.data;
    console.log(`Processing analytics: ${type} for user ${userId || "all"}`);
    return { success: true };
  },
  { connection }
);

analyticsWorker.on("completed", (job) => {
  console.log(`Analytics job ${job.id} completed`);
});

const reportWorker = new Worker(
  "report-generation",
  async (job: Job) => {
    const { type, userId, filters } = job.data;
    console.log(`Generating report: ${type} for user ${userId || "all"}`);
    return { success: true, reportUrl: `/reports/${job.id}.pdf` };
  },
  { connection }
);

reportWorker.on("completed", (job) => {
  console.log(`Report job ${job.id} completed`);
});

const repaymentReminderWorker = new Worker(
  "repayment-reminder",
  async (job: Job) => {
    if (job.name === "sweep-reminders") {
      const scheduled = await scheduleRepaymentReminders();
      return { success: true, scheduled };
    }

    if (job.name === "sweep-overdue") {
      const result = await processOverdueRepayments();
      return { success: true, ...result };
    }

    const { userId, repaymentId, installmentNumber, dueDate, amount, email, fullName } = job.data;
    const due = new Date(dueDate);
    const isOverdue = due.getTime() < Date.now();
    const dueLabel = due.toLocaleDateString("en-IN");
    const amountLabel = Number(amount).toLocaleString("en-IN");

    await emailService.sendRepaymentReminderEmail(email, fullName, due, Number(amount));

    await NotificationService.createNotification({
      userId,
      title: isOverdue ? "EMI Overdue" : "EMI Payment Reminder",
      message: isOverdue
        ? `Your EMI installment #${installmentNumber} of ₹${amountLabel} was due on ${dueLabel}. Please pay at the earliest.`
        : `Your EMI installment #${installmentNumber} of ₹${amountLabel} is due on ${dueLabel}.`,
      metadata: {
        repaymentId,
        installmentNumber,
        type: "repayment_reminder",
      },
      type: "system",
    });

    return { success: true };
  },
  { connection }
);

repaymentReminderWorker.on("completed", (job) => {
  console.log(`Repayment reminder job ${job.id} completed`);
});

repaymentReminderWorker.on("failed", (job, err) => {
  console.error(`Repayment reminder job ${job?.id} failed:`, err.message);
});

const registerRepaymentReminderScheduler = async () => {
  try {
    await repaymentReminderQueue.upsertJobScheduler(
      "repayment-reminder-daily",
      { pattern: "0 6 * * *", tz: "Asia/Kolkata" },
      { name: "sweep-reminders" }
    );
    console.log("Repayment reminder daily scheduler registered");
  } catch (error: any) {
    console.error("Failed to register repayment reminder scheduler:", error.message);
  }

  try {
    await repaymentReminderQueue.upsertJobScheduler(
      "repayment-overdue-daily",
      { pattern: "0 2 * * *", tz: "Asia/Kolkata" },
      { name: "sweep-overdue" }
    );
    console.log("Repayment overdue daily scheduler registered");
  } catch (error: any) {
    console.error("Failed to register repayment overdue scheduler:", error.message);
  }
};

registerRepaymentReminderScheduler();

export {
  emailWorker,
  notificationWorker,
  analyticsWorker,
  reportWorker,
  repaymentReminderWorker,
};
