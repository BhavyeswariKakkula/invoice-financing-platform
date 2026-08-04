import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db";
import Repayment from "../models/Repayment";
import RepaymentSchedule from "../models/RepaymentSchedule";
import {
  calculateEMI,
  calculateTotalInterest,
  generateAmortizationSchedule,
  roundMoney,
} from "../utils/amortization";

/**
 * Migrates legacy one-time-payment repayments to the EMI model:
 * - generates an amortization schedule for repayments that have none
 * - backfills loan summary fields (emiAmount, totalInterest, totals, etc.)
 * - maps old statuses to the new enum
 *
 * Run: npm run migrate:emi
 */
const migrateRepaymentsToEMI = async () => {
  try {
    await connectDB();

    const legacy = await Repayment.find({
      _id: {
        $nin: await RepaymentSchedule.distinct("repaymentId"),
      },
    });

    console.log(`Found ${legacy.length} repayment(s) without an EMI schedule`);

    let migrated = 0;
    let skipped = 0;

    for (const repayment of legacy) {
      try {
        const principal = repayment.disbursedAmount || repayment.remainingAmount || 0;
        if (principal <= 0) {
          console.log(`Skipping repayment ${repayment._id}: no principal`);
          skipped += 1;
          continue;
        }

        const annualInterestRate =
          repayment.annualInterestRate && repayment.annualInterestRate > 0
            ? repayment.annualInterestRate
            : 12;
        const tenureMonths =
          repayment.tenureMonths && repayment.tenureMonths > 0
            ? repayment.tenureMonths
            : 6;

        if (!repayment.annualInterestRate || !repayment.tenureMonths) {
          console.warn(
            `Repayment ${repayment._id}: using defaults (rate=${annualInterestRate}%, tenure=${tenureMonths}mo)`
          );
        }

        const emiAmount = calculateEMI(principal, annualInterestRate, tenureMonths);
        const totalInterest = calculateTotalInterest(principal, annualInterestRate, tenureMonths);
        const totalPayable = roundMoney(principal + totalInterest);
        const startDate = repayment.createdAt || new Date();

        const schedule = generateAmortizationSchedule(
          principal,
          annualInterestRate,
          tenureMonths,
          startDate
        );

        const oldStatus = repayment.status;
        const isClosed =
          oldStatus === "paid" || (oldStatus === "pending_verification" && repayment.amountPaid >= principal);

        const newStatus = isClosed
          ? "completed"
          : oldStatus === "overdue"
            ? "overdue"
            : "active";

        repayment.annualInterestRate = annualInterestRate;
        repayment.tenureMonths = tenureMonths;
        repayment.emiAmount = emiAmount;
        repayment.totalInterest = totalInterest;
        repayment.totalPayable = totalPayable;
        repayment.remainingAmount = isClosed
          ? 0
          : roundMoney(totalPayable - (repayment.amountPaid || 0));
        repayment.totalInstallments = tenureMonths;
        repayment.emisPaid = isClosed ? tenureMonths : 0;
        repayment.currentInstallmentNumber = isClosed ? tenureMonths + 1 : 1;
        repayment.nextDueDate = isClosed ? undefined : schedule[0].dueDate;
        repayment.principalPaid = isClosed ? principal : 0;
        repayment.interestCollected = isClosed ? totalInterest : 0;
        repayment.outstandingPrincipal = isClosed ? 0 : principal;
        repayment.outstandingInterest = isClosed ? 0 : totalInterest;
        repayment.status = newStatus as any;
        repayment.closedAt = isClosed
          ? repayment.closedAt || repayment.paymentDate || new Date()
          : undefined;

        await repayment.save();

        await RepaymentSchedule.insertMany(
          schedule.map((item) => ({
            repaymentId: repayment._id,
            financingId: repayment.financingId,
            businessId: repayment.businessId,
            invoiceId: repayment.invoiceId,
            installmentNumber: item.installmentNumber,
            totalInstallments: item.totalInstallments,
            openingBalance: item.openingBalance,
            principalAmount: item.principalAmount,
            interestAmount: item.interestAmount,
            emiAmount: item.emiAmount,
            closingBalance: item.closingBalance,
            dueDate: item.dueDate,
            status: isClosed
              ? "paid"
              : item.dueDate.getTime() < Date.now()
                ? "overdue"
                : "pending",
          }))
        );

        console.log(
          `Migrated repayment ${repayment._id} (${oldStatus} -> ${newStatus}, ${tenureMonths} EMIs of ${emiAmount})`
        );
        migrated += 1;
      } catch (error: any) {
        console.error(`Failed to migrate repayment ${repayment._id}:`, error?.message);
      }
    }

    console.log(
      `Migration complete: ${migrated} migrated, ${skipped} skipped, ${legacy.length - migrated - skipped} failed`
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateRepaymentsToEMI();

export default migrateRepaymentsToEMI;
