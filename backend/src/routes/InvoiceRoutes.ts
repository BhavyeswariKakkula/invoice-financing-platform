import { Router } from "express";
import InvoiceController from "../controllers/InvoiceController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import upload from "../middleware/upload";
import { invoiceUploadLimiter } from "../middleware/rateLimiter";
import {
  createInvoiceValidation,
  updateInvoiceValidation,
  invoiceIdValidation,
  invoiceQueryValidation,
} from "../validations/invoiceValidation";

const router = Router();

router.post(
  "/",
  authMiddleware,
  rbacMiddleware("business"),
  invoiceUploadLimiter,
  upload.single("invoiceFile"),
  createInvoiceValidation,
  InvoiceController.createInvoice
);

router.get(
  "/my",
  authMiddleware,
  rbacMiddleware("business"),
  invoiceQueryValidation,
  InvoiceController.getUserInvoices
);

router.get(
  "/stats",
  authMiddleware,
  InvoiceController.getInvoiceStats
);

router.get(
  "/all",
  authMiddleware,
  rbacMiddleware("admin"),
  invoiceQueryValidation,
  InvoiceController.getAllInvoices
);

router.get(
  "/:id",
  authMiddleware,
  invoiceIdValidation,
  InvoiceController.getInvoice
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware("business"),
  updateInvoiceValidation,
  InvoiceController.updateInvoice
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware("business"),
  invoiceIdValidation,
  InvoiceController.deleteInvoice
);

router.put(
  "/:id/submit",
  authMiddleware,
  rbacMiddleware("business"),
  invoiceIdValidation,
  InvoiceController.submitInvoice
);

export default router;
