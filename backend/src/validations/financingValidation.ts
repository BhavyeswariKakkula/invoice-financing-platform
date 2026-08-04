import { body, param, validationResult } from "express-validator";
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

export const applyFinancingValidation = [
  body("invoiceId")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isMongoId()
    .withMessage("Invalid invoice ID"),
  body("requestedAmount")
    .notEmpty()
    .withMessage("Requested amount is required")
    .isFloat({ min: 1 })
    .withMessage("Requested amount must be greater than 0"),
  body("tenureMonths")
    .notEmpty()
    .withMessage("Tenure in months is required")
    .isInt({ min: 1, max: 36 })
    .withMessage("Tenure must be between 1 and 36 months"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

export const approveFinancingValidation = [
  param("id")
    .notEmpty()
    .withMessage("Financing ID is required")
    .isMongoId()
    .withMessage("Invalid financing ID"),
  body("approvedAmount")
    .notEmpty()
    .withMessage("Approved amount is required")
    .isFloat({ min: 1 })
    .withMessage("Approved amount must be greater than 0"),
  body("interestRate")
    .notEmpty()
    .withMessage("Interest rate is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Interest rate must be between 0 and 100"),
  body("processingFee")
    .notEmpty()
    .withMessage("Processing fee is required")
    .isFloat({ min: 0 })
    .withMessage("Processing fee must be a non-negative number"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

export const rejectFinancingValidation = [
  param("id")
    .notEmpty()
    .withMessage("Financing ID is required")
    .isMongoId()
    .withMessage("Invalid financing ID"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

export const financingIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Financing ID is required")
    .isMongoId()
    .withMessage("Invalid financing ID"),
  handleValidationErrors,
];
