import { Router } from "express";
import BusinessProfileController from "../controllers/BusinessProfileController";
import authMiddleware from "../middleware/auth";
import rbacMiddleware from "../middleware/rbac";
import { updateBusinessProfileValidation } from "../validations/adminValidation";

const router = Router();

router.post(
  "/",
  authMiddleware,
  rbacMiddleware("business"),
  BusinessProfileController.createProfile
);

router.get(
  "/",
  authMiddleware,
  rbacMiddleware("business"),
  BusinessProfileController.getProfile
);

router.put(
  "/",
  authMiddleware,
  rbacMiddleware("business"),
  updateBusinessProfileValidation,
  BusinessProfileController.updateProfile
);

router.get(
  "/all",
  authMiddleware,
  rbacMiddleware("admin"),
  BusinessProfileController.getAllProfiles
);

router.put(
  "/verify/:id",
  authMiddleware,
  rbacMiddleware("admin"),
  BusinessProfileController.verifyProfile
);

export default router;
