import { Router } from "express";
import FinancingController from "../controllers/FinancingController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import {
  applyFinancingValidation,
  approveFinancingValidation,
  rejectFinancingValidation,
  financingIdValidation,
} from "../validations/financingValidation";

const router = Router();

// Business APIs
router.post(
  "/apply",
  authMiddleware,
  rbacMiddleware("business"),
  applyFinancingValidation,
  FinancingController.applyForFinancing
);

router.get(
  "/my",
  authMiddleware,
  rbacMiddleware("business"),
  FinancingController.getMyFinancingRequests
);

// Admin APIs
router.get(
  "/all",
  authMiddleware,
  rbacMiddleware("admin"),
  FinancingController.getAllFinancingRequests
);

router.patch(
  "/:id/approve",
  authMiddleware,
  rbacMiddleware("admin"),
  approveFinancingValidation,
  FinancingController.approveFinancing
);

router.patch(
  "/:id/reject",
  authMiddleware,
  rbacMiddleware("admin"),
  rejectFinancingValidation,
  FinancingController.rejectFinancing
);

router.patch(
  "/:id/disburse",
  authMiddleware,
  rbacMiddleware("admin"),
  financingIdValidation,
  FinancingController.disburseFinancing
);

// Shared APIs (business sees own, admin sees any)
router.get(
  "/stats",
  authMiddleware,
  FinancingController.getStats
);

router.get(
  "/:id",
  authMiddleware,
  financingIdValidation,
  FinancingController.getFinancingRequestById
);

export default router;
