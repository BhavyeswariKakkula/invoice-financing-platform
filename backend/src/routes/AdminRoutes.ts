import { Router } from "express";
import AdminController from "../controllers/AdminController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";

const router = Router();

router.get(
  "/businesses",  
  authMiddleware,
  rbacMiddleware("admin"),
  AdminController.getAllBusinesses
);

router.get(
  "/businesses/:id",
  authMiddleware,
  rbacMiddleware("admin"),
  AdminController.getBusinessById
);

router.put(
  "/businesses/:id/toggle-verification",
  authMiddleware,
  rbacMiddleware("admin"),
  AdminController.toggleBusinessVerification
);

router.delete(
  "/businesses/:id",
  authMiddleware,
  rbacMiddleware("admin"),
  AdminController.deleteUser
);

router.get(
  "/stats",
  authMiddleware,
  rbacMiddleware("admin"),
  AdminController.getStats
);

export default router;
