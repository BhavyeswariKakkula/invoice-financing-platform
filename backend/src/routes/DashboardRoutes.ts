import { Router } from "express";
import DashboardController from "../controllers/DashboardController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";

const router = Router();

router.get(
  "/business",
  authMiddleware,
  rbacMiddleware("business"),
  DashboardController.getBusinessDashboard
);

router.get(
  "/admin",
  authMiddleware,
  rbacMiddleware("admin"),
  DashboardController.getAdminDashboard
);

export default router;
