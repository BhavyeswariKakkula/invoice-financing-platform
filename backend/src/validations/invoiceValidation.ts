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

export const createInvoiceValidation = [
  body("buyerName")
    .trim()
    .notEmpty()
    .withMessage("Buyer name is required"),
  body("buyerCompany")
    .trim()
    .notEmpty()
    .withMessage("Buyer company is required"),
  body("invoiceAmount")
    .notEmpty()
    .withMessage("Invoice amount is required")
    .isFloat({ min: 1 })
    .withMessage("Invoice amount must be greater than 0"),
  body("taxPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Tax percentage must be between 0 and 100"),
  body("taxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["INR", "USD", "EUR", "GBP"])
    .withMessage("Invalid currency"),
  body("invoiceDate")
    .notEmpty()
    .withMessage("Invoice date is required")
    .isISO8601()
    .withMessage("Invalid invoice date"),
  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Invalid due date"),
  handleValidationErrors,
];

export const updateInvoiceValidation = [
  param("id")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isMongoId()
    .withMessage("Invalid invoice ID"),
  body("buyerName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Buyer name cannot be empty"),
  body("buyerCompany")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Buyer company cannot be empty"),
  body("invoiceAmount")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Invoice amount must be greater than 0"),
  handleValidationErrors,
];

export const invoiceIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isMongoId()
    .withMessage("Invalid invoice ID"),
  handleValidationErrors,
];

export const invoiceQueryValidation = [
  query("status")
    .optional()
    .isIn([
      "draft",
      "submitted",
      "under_verification",
      "verified",
      "rejected",
      "requires_correction",
      "financed",
      "closed",
    ])
    .withMessage("Invalid status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query too long"),
  handleValidationErrors,
];
