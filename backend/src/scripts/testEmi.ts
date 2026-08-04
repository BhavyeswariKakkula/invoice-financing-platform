import dotenv from "dotenv";
dotenv.config();

import {
  roundMoney,
  calculateEMI,
  calculateTotalInterest,
  generateAmortizationSchedule,
  calculateAccruedInterest,
  calculateLateFee,
  overdueDays,
  sumInstallments,
} from "../utils/amortization";

let passed = 0;
let failed = 0;

const assert = (condition: boolean, label: string, detail?: any) => {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL: ${label}`, detail ?? "");
  }
};

const closeTo = (actual: number, expected: number, tolerance = 0.01) =>
  Math.abs(actual - expected) <= tolerance;

const testEMI = () => {
  console.log("\n[1] EMI calculation (Standard Example: 6,00,000 @ 12% p.a. / 6 months)");
  const emi = calculateEMI(600000, 12, 6);
  console.log(`  EMI = ${emi}`);
  assert(closeTo(emi, 103529.02), "EMI ~= 103,529.02", { emi });
  assert(emi > 0, "EMI is positive");
};

const testSchedule = () => {
  console.log("\n[2] Amortization schedule integrity");
  const principal = 600000;
  const rate = 12;
  const months = 6;
  const schedule = generateAmortizationSchedule(
    principal,
    rate,
    months,
    new Date("2026-01-01")
  );

  assert(schedule.length === months, "Schedule has 6 installments");

  const totalPrincipal = roundMoney(
    schedule.reduce((acc, i) => acc + i.principalAmount, 0)
  );
  const totalInterest = roundMoney(
    schedule.reduce((acc, i) => acc + i.interestAmount, 0)
  );
  const totalEmi = sumInstallments(schedule);
  const lastClosing = schedule[schedule.length - 1].closingBalance;

  console.log(`  Total principal: ${totalPrincipal}`);
  console.log(`  Total interest: ${totalInterest}`);
  console.log(`  Total EMI: ${totalEmi}`);
  console.log(`  Last closing balance: ${lastClosing}`);

  assert(closeTo(totalPrincipal, principal, 0.01), "Sum of principal = loan amount", { totalPrincipal });
  assert(closeTo(totalInterest, calculateTotalInterest(principal, rate, months), 0.01), "Sum of interest = total interest", { totalInterest });
  assert(closeTo(totalEmi, roundMoney(totalInterest + principal), 0.01), "Sum of EMIs = principal + interest", { totalEmi });
  assert(Math.abs(lastClosing) < 0.01, "Last closing balance is zero", { lastClosing });

  let openingOK = true;
  schedule.forEach((item, idx) => {
    if (idx > 0 && item.openingBalance !== schedule[idx - 1].closingBalance) {
      openingOK = false;
    }
  });
  assert(openingOK, "Each opening balance equals previous closing balance");
};

const testRoundingAbsorption = () => {
  console.log("\n[3] Rounding absorption (10-month, non-round numbers)");
  const schedule = generateAmortizationSchedule(250000, 11.5, 10, new Date("2026-01-01"));
  const lastClosing = schedule[schedule.length - 1].closingBalance;
  const totalPrincipal = roundMoney(schedule.reduce((a, i) => a + i.principalAmount, 0));
  assert(Math.abs(lastClosing) < 0.01, "Last closing balance ~= 0", { lastClosing });
  assert(closeTo(totalPrincipal, 250000, 0.01), "Total principal = 250000", { totalPrincipal });
};

const testAccruedInterest = () => {
  console.log("\n[4] Early closure accrued interest");
  const interest = calculateAccruedInterest(600000, 12, new Date("2026-01-01"), new Date("2026-02-01"));
  console.log(`  Accrued for 31 days on 6,00,000 @12% = ${interest}`);
  assert(
    closeTo(interest, roundMoney(600000 * 0.12 * (31 / 365)), 0.01),
    "Simple interest for 31 days",
    { interest }
  );
  assert(calculateAccruedInterest(100, 12, new Date("2026-02-01"), new Date("2026-01-01")) === 0, "No negative/backward accrual");
};

const testLateFee = () => {
  console.log("\n[5] Late fee (flat daily % of EMI)");
  const fee = calculateLateFee(103548.43, 10, 0.05);
  console.log(`  Fee for 10 days at 0.05%/day on 103548.43 = ${fee}`);
  assert(closeTo(fee, roundMoney(103548.43 * 0.0005 * 10), 0.01), "Fee = EMI * 0.05% * days", { fee });
  assert(calculateLateFee(100, 0, 5) === 0, "Zero fee when overdueDays = 0");
  const days = overdueDays(new Date("2026-01-01"), new Date("2026-01-11"));
  assert(days === 10, "overdueDays counts elapsed days", { days });
};

const testZeroRate = () => {
  console.log("\n[6] Zero-interest edge case");
  const emi = calculateEMI(600000, 0, 6);
  assert(closeTo(emi, 100000, 0.01), "EMI = principal / tenure when rate = 0", { emi });
  assert(calculateTotalInterest(600000, 0, 6) === 0, "No interest at 0%");
  const schedule = generateAmortizationSchedule(600000, 0, 6, new Date("2026-01-01"));
  assert(schedule.every((i) => i.interestAmount === 0), "All interest components are zero");
};

const testRoundMoney = () => {
  console.log("\n[7] Rounding helper");
  assert(roundMoney(1.005) === 1.01, "roundMoney(1.005) = 1.01", { v: roundMoney(1.005) });
  assert(roundMoney(1.004) === 1.0, "roundMoney(1.004) = 1.00");
  assert(roundMoney(0.1 + 0.2) === 0.3, "Floating point 0.1+0.2 = 0.3");
};

const run = () => {
  testEMI();
  testSchedule();
  testRoundingAbsorption();
  testAccruedInterest();
  testLateFee();
  testZeroRate();
  testRoundMoney();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

run();
