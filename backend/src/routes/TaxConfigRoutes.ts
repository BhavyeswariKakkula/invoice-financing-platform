import { Router } from "express";
import TaxConfigController from "../controllers/TaxConfigController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import { body, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

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

const router = Router();

// Public-ish: any authenticated user can get active tax config
router.get(
  "/active",
  authMiddleware,
  TaxConfigController.getActiveTaxConfig
);

// Admin only
router.get(
  "/",
  authMiddleware,
  rbacMiddleware("admin"),
  TaxConfigController.getAllTaxConfigs
);

router.post(
  "/",
  authMiddleware,
  rbacMiddleware("admin"),
  [
    body("taxName").trim().notEmpty().withMessage("Tax name is required"),
    body("taxPercentage")
      .notEmpty()
      .withMessage("Tax percentage is required")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax percentage must be between 0 and 100"),
    handleValidationErrors,
  ],
  TaxConfigController.createTaxConfig
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware("admin"),
  [
    param("id").isMongoId().withMessage("Invalid tax config ID"),
    body("taxName").optional().trim().notEmpty().withMessage("Tax name cannot be empty"),
    body("taxPercentage")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax percentage must be between 0 and 100"),
    handleValidationErrors,
  ],
  TaxConfigController.updateTaxConfig
);

router.patch(
  "/:id/toggle",
  authMiddleware,
  rbacMiddleware("admin"),
  [
    param("id").isMongoId().withMessage("Invalid tax config ID"),
    handleValidationErrors,
  ],
  TaxConfigController.toggleTaxConfig
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware("admin"),
  [
    param("id").isMongoId().withMessage("Invalid tax config ID"),
    handleValidationErrors,
  ],
  TaxConfigController.deleteTaxConfig
);

export default router;
