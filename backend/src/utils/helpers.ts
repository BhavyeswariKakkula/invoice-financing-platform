export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateInvoiceNumber = (): string => {
  const prefix = "INV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const calculateFinancingAmount = (
  invoiceAmount: number,
  financingPercentage: number
): number => {
  return (invoiceAmount * financingPercentage) / 100;
};

export const calculateRepaymentSchedule = (
  financedAmount: number,
  durationDays: number,
  interestRate: number = 2
): { dueDate: Date; amount: number }[] => {
  const schedule: { dueDate: Date; amount: number }[] = [];
  const monthlyPayment =
    (financedAmount * (1 + (interestRate / 100) * (durationDays / 30))) /
    (durationDays / 30);

  let remaining = financedAmount;
  const installmentCount = Math.ceil(durationDays / 30);
  const perInstallment = financedAmount / installmentCount;

  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + i * 30);

    const interest = perInstallment * (interestRate / 100) * (30 / 365);
    const amount = Math.round((perInstallment + interest) * 100) / 100;
    remaining = Math.round((remaining - perInstallment) * 100) / 100;

    schedule.push({ dueDate, amount });
  }

  return schedule;
};

export const formatCurrency = (
  amount: number,
  currency: string = "INR"
): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
};
