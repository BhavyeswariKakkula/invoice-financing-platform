import { Router } from "express";
import VerificationController from "../controllers/VerificationController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import { verificationActionValidation } from "../validations/adminValidation";

const router = Router();

router.post(
  "/:id/verify",
  authMiddleware,
  rbacMiddleware("admin"),
  verificationActionValidation,
  VerificationController.verifyInvoice
);

router.get(
  "/invoice/:id",
  authMiddleware,
  VerificationController.getVerificationByInvoice
);

router.get(
  "/all",
  authMiddleware,
  rbacMiddleware("admin"),
  VerificationController.getAllVerifications
);

router.get(
  "/stats",
  authMiddleware,
  rbacMiddleware("admin"),
  VerificationController.getVerificationStats
);

export default router;
