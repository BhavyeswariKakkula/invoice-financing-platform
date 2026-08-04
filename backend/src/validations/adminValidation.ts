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

export const verificationActionValidation = [
  param("id")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isMongoId()
    .withMessage("Invalid invoice ID"),
  body("result")
    .notEmpty()
    .withMessage("Verification result is required")
    .isIn(["approved", "rejected", "requires_correction"])
    .withMessage("Invalid verification result"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

export const updateBusinessProfileValidation = [
  body("companyName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty"),
  body("registrationNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Registration number cannot be empty"),
  body("gstNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("GST number cannot be empty"),
  body("panNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("PAN number cannot be empty"),
  body("contactPerson")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Contact person cannot be empty"),
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone cannot be empty"),
  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty"),
  body("businessCategory")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Business category cannot be empty"),
  handleValidationErrors,
];
