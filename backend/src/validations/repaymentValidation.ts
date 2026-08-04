import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: (err as any).path,
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

export const submitPaymentValidation = [
  body("repaymentId")
    .notEmpty()
    .withMessage("Repayment ID is required")
    .isMongoId()
    .withMessage("Invalid repayment ID"),
  body("amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Payment amount must be greater than 0"),
  body("paymentType")
    .optional()
    .isIn(["emi", "prepay", "close"])
    .withMessage("Invalid payment type"),
  body("prepayInstallments")
    .optional()
    .isInt({ min: 1 })
    .withMessage("prepayInstallments must be a positive integer"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["bank_transfer", "upi", "cash", "other"])
    .withMessage("Invalid payment method"),
  body("transactionId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Transaction ID cannot exceed 100 characters"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

export const scheduleQueryValidation = [
  param("id")
    .notEmpty()
    .withMessage("Repayment ID is required")
    .isMongoId()
    .withMessage("Invalid repayment ID"),
  query("status")
    .optional()
    .isIn(["pending", "paid", "overdue", "prepaid"])
    .withMessage("Invalid installment status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

export const repaymentIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Repayment ID is required")
    .isMongoId()
    .withMessage("Invalid repayment ID"),
  handleValidationErrors,
];

export const rejectPaymentValidation = [
  param("id")
    .notEmpty()
    .withMessage("Repayment ID is required")
    .isMongoId()
    .withMessage("Invalid repayment ID"),
  body("reason")
    .notEmpty()
    .withMessage("Rejection reason is required")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Rejection reason cannot exceed 500 characters"),
  handleValidationErrors,
];

export const repaymentQueryValidation = [
  query("status")
    .optional()
    .isIn([
      "pending",
      "pending_verification",
      "partial",
      "paid",
      "overdue",
      "rejected",
      "active",
      "completed",
      "prepaid",
    ])
    .withMessage("Invalid repayment status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term too long"),
  query("sortBy")
    .optional()
    .isIn(["dueDate", "totalPayable", "amountPaid", "remainingAmount", "createdAt", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Invalid sort order"),
  handleValidationErrors,
];
