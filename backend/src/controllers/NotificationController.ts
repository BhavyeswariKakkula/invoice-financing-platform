import { Response } from "express";
import NotificationService from "../services/NotificationService";
import { AuthRequest } from "../middleware/auth";

class NotificationController {
  async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getUserNotifications(
        req.user!.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUnreadNotifications(req: AuthRequest, res: Response) {
    try {
      const notifications = await NotificationService.getUnreadNotifications(
        req.user!.id
      );

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const notification = await NotificationService.markAsRead(
        req.params.id as string,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const result = await NotificationService.getUnreadCount(req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const result = await NotificationService.deleteNotification(
        req.params.id as string,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new NotificationController();
