import { Router } from "express";
import RepaymentController from "../controllers/RepaymentController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import { paymentProofUpload } from "../middleware/upload";
import {
  submitPaymentValidation,
  repaymentIdValidation,
  rejectPaymentValidation,
  repaymentQueryValidation,
  scheduleQueryValidation,
} from "../validations/repaymentValidation";

const router = Router();

// Business APIs
router.post(
  "/pay",
  authMiddleware,
  rbacMiddleware("business"),
  paymentProofUpload.single("paymentProof"),
  submitPaymentValidation,
  RepaymentController.submitPayment
);

router.get(
  "/my",
  authMiddleware,
  rbacMiddleware("business"),
  repaymentQueryValidation,
  RepaymentController.getMyRepayments
);

router.get(
  "/summary",
  authMiddleware,
  rbacMiddleware("business"),
  RepaymentController.getDashboardSummary
);

router.get(
  "/stats",
  authMiddleware,
  RepaymentController.getStats
);

// Admin APIs
router.get(
  "/admin",
  authMiddleware,
  rbacMiddleware("admin"),
  repaymentQueryValidation,
  RepaymentController.getAllRepayments
);

router.put(
  "/admin/:id/verify",
  authMiddleware,
  rbacMiddleware("admin"),
  repaymentIdValidation,
  RepaymentController.verifyPayment
);

router.put(
  "/admin/:id/reject",
  authMiddleware,
  rbacMiddleware("admin"),
  rejectPaymentValidation,
  RepaymentController.rejectPayment
);

// Shared APIs (business sees own, admin sees any)
router.get(
  "/:id/schedule",
  authMiddleware,
  scheduleQueryValidation,
  RepaymentController.getSchedule
);

router.get(
  "/:id/quote",
  authMiddleware,
  rbacMiddleware("business"),
  repaymentIdValidation,
  RepaymentController.getEarlyClosureQuote
);

router.get(
  "/:id",
  authMiddleware,
  repaymentIdValidation,
  RepaymentController.getRepayment
);

export default router;
