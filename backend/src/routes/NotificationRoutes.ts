import { Router } from "express";
import NotificationController from "../controllers/NotificationController";
import authMiddleware from "../middleware/auth";
import { param } from "express-validator";
import { handleValidationErrors } from "../validations/authValidation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  NotificationController.getUserNotifications
);

router.get(
  "/unread",
  authMiddleware,
  NotificationController.getUnreadNotifications
);

router.get(
  "/unread-count",
  authMiddleware,
  NotificationController.getUnreadCount
);

router.patch(
  "/:id/read",
  authMiddleware,
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid notification ID"),
    handleValidationErrors,
  ],
  NotificationController.markAsRead
);

router.patch(
  "/read-all",
  authMiddleware,
  NotificationController.markAllAsRead
);

router.delete(
  "/:id",
  authMiddleware,
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid notification ID"),
    handleValidationErrors,
  ],
  NotificationController.deleteNotification
);

export default router;
