const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = parseFloat(value || "");
  return isNaN(parsed) ? fallback : parsed;
};

export const repaymentConfig = {
  get lateFeeDailyPercent(): number {
    return toNumber(process.env.LATE_FEE_DAILY_PERCENT, 0.05);
  },
  get reminderDays(): number {
    return toNumber(process.env.REPAYMENT_REMINDER_DAYS, 7);
  },
  get amountTolerance(): number {
    return 0.01;
  },
};

export default repaymentConfig;
