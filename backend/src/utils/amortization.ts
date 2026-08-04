export const roundMoney = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export interface AmortizationInstallment {
  installmentNumber: number;
  totalInstallments: number;
  openingBalance: number;
  interestAmount: number;
  principalAmount: number;
  emiAmount: number;
  closingBalance: number;
  dueDate: Date;
}

/**
 * Standard reducing-balance EMI:
 * EMI = P x R x (1 + R)^N / ((1 + R)^N - 1)
 * where R = annualInterestRate / 12 / 100
 */
export const calculateEMI = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number => {
  if (principal <= 0 || tenureMonths <= 0) return 0;

  const R = annualInterestRate / 12 / 100;

  if (R === 0) {
    return roundMoney(principal / tenureMonths);
  }

  const factor = Math.pow(1 + R, tenureMonths);
  const emi = (principal * R * factor) / (factor - 1);

  return roundMoney(emi);
};

export const calculateTotalInterest = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number => {
  if (annualInterestRate === 0 || tenureMonths <= 0) return 0;

  const emi = calculateEMI(principal, annualInterestRate, tenureMonths);
  const total = emi * tenureMonths;
  return roundMoney(Math.max(0, total - principal));
};

/**
 * Builds the full amortization schedule (opening balance, interest, principal,
 * EMI, closing balance). The last installment is adjusted so the loan closes
 * exactly at zero, absorbing any rounding differences.
 */
export const generateAmortizationSchedule = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  startDate: Date = new Date()
): AmortizationInstallment[] => {
  if (principal <= 0 || tenureMonths <= 0) return [];

  const R = annualInterestRate / 12 / 100;
  const emi = calculateEMI(principal, annualInterestRate, tenureMonths);
  const schedule: AmortizationInstallment[] = [];
  let opening = roundMoney(principal);

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = roundMoney(opening * R);
    let principalPart: number;
    let emiPart: number;

    if (i === tenureMonths) {
      principalPart = opening;
      emiPart = roundMoney(principalPart + interest);
    } else {
      principalPart = roundMoney(emi - interest);
      if (principalPart > opening) {
        principalPart = opening;
      }
      emiPart = roundMoney(principalPart + interest);
    }

    const closing = roundMoney(opening - principalPart);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      totalInstallments: tenureMonths,
      openingBalance: opening,
      interestAmount: interest,
      principalAmount: principalPart,
      emiAmount: emiPart,
      closingBalance: closing,
      dueDate,
    });

    opening = closing;
  }

  return schedule;
};

/**
 * Simple interest accrued between two dates (used for early closure quotes).
 * Interest = outstandingPrincipal x (annualRate/100) x days/365
 */
export const calculateAccruedInterest = (
  outstandingPrincipal: number,
  annualInterestRate: number,
  fromDate: Date,
  toDate: Date = new Date()
): number => {
  if (outstandingPrincipal <= 0 || annualInterestRate <= 0) return 0;

  const days = Math.max(
    0,
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000)
  );

  if (days === 0) return 0;

  return roundMoney((outstandingPrincipal * (annualInterestRate / 100)) * (days / 365));
};

/**
 * Flat daily late fee applied to an overdue EMI:
 * fee = emiAmount x (dailyLateFeeRate/100) x overdueDays
 */
export const calculateLateFee = (
  emiAmount: number,
  overdueDays: number,
  dailyLateFeeRate: number
): number => {
  if (emiAmount <= 0 || overdueDays <= 0 || dailyLateFeeRate <= 0) return 0;
  return roundMoney(emiAmount * (dailyLateFeeRate / 100) * overdueDays);
};

export const overdueDays = (dueDate: Date, from: Date = new Date()): number => {
  const ms = from.getTime() - new Date(dueDate).getTime();
  return ms > 0 ? Math.floor(ms / 86400000) : 0;
};

export const sumInstallments = (
  installments: { emiAmount: number }[]
): number => {
  return roundMoney(
    installments.reduce((acc, item) => acc + item.emiAmount, 0)
  );
};
