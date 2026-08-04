import { Router } from "express";
import ReportController from "../controllers/ReportController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";

const router = Router();

router.get(
  "/invoices",
  authMiddleware,
  ReportController.getInvoiceReport
);

router.get(
  "/financing",
  authMiddleware,
  ReportController.getFinancingReport
);

router.get(
  "/repayments",
  authMiddleware,
  ReportController.getRepaymentReport
);

router.get(
  "/businesses",
  authMiddleware,
  rbacMiddleware("admin"),
  ReportController.getBusinessReport
);

router.get(
  "/revenue",
  authMiddleware,
  rbacMiddleware("admin"),
  ReportController.getRevenueReport
);

router.get(
  "/amortization/:id",
  authMiddleware,
  ReportController.getAmortizationReport
);

router.get(
  "/amortization/:id/export",
  authMiddleware,
  ReportController.exportAmortizationReport
);

export default router;
