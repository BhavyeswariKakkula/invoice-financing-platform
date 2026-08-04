import { Response } from "express";
import VerificationService from "../services/VerificationService";
import { AuthRequest } from "../middleware/auth";

class VerificationController {
  async verifyInvoice(req: AuthRequest, res: Response) {
    try {
      const { result, remarks, checks } = req.body;

      const verification = await VerificationService.verifyInvoice(
        req.params.id as string,
        req.user!.id,
        result,
        remarks,
        checks
      );

      res.status(200).json({
        success: true,
        message: `Invoice ${result} successfully`,
        data: verification,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getVerificationByInvoice(req: AuthRequest, res: Response) {
    try {
      const verifications = await VerificationService.getVerificationByInvoice(
        req.params.id as string
      );

      res.status(200).json({
        success: true,
        data: verifications,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllVerifications(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = req.query.result as string | undefined;

      const data = await VerificationService.getAllVerifications(
        page,
        limit,
        result
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getVerificationStats(req: AuthRequest, res: Response) {
    try {
      const stats = await VerificationService.getVerificationStats();

      res.status(200).json({
        success: true,
        data: stats,
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

export default new VerificationController();
