import { Queue } from "bullmq";
import redis from "../config/redis";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const emailQueue = new Queue("email", { connection });
export const invoiceVerificationQueue = new Queue("invoice-verification", { connection });
export const analyticsQueue = new Queue("analytics", { connection });
export const reportQueue = new Queue("report-generation", { connection });
export const repaymentReminderQueue = new Queue("repayment-reminder", { connection });
export const notificationQueue = new Queue("notification", { connection });
