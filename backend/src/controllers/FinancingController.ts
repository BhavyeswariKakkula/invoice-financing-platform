import { Response } from "express";
import FinancingService from "../services/FinancingService";
import { AuthRequest } from "../middleware/auth";

class FinancingController {
  async applyForFinancing(req: AuthRequest, res: Response) {
    try {
      const request = await FinancingService.applyForFinancing(
        req.user!.id,
        {
          invoiceId: req.body.invoiceId,
          requestedAmount: req.body.requestedAmount,
          tenureMonths: req.body.tenureMonths,
          remarks: req.body.remarks,
        }
      );

      res.status(201).json({
        success: true,
        message: "Financing request submitted successfully",
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyFinancingRequests(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await FinancingService.getMyFinancingRequests(
        req.user!.id,
        page,
        limit,
        status
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

  async getFinancingRequestById(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === "admin";

      const request = await FinancingService.getFinancingRequestById(
        req.params.id as string,
        isAdmin ? undefined : req.user!.id,
        isAdmin
      );

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllFinancingRequests(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await FinancingService.getAllFinancingRequests(
        page,
        limit,
        status
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

  async approveFinancing(req: AuthRequest, res: Response) {
    try {
      const { approvedAmount, interestRate, processingFee, remarks } = req.body;

      const request = await FinancingService.approveFinancing(
        req.params.id as string,
        req.user!.id,
        approvedAmount,
        interestRate || 0,
        processingFee || 0,
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Financing request approved successfully",
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rejectFinancing(req: AuthRequest, res: Response) {
    try {
      const { remarks } = req.body;

      const request = await FinancingService.rejectFinancing(
        req.params.id as string,
        req.user!.id,
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Financing request rejected",
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async disburseFinancing(req: AuthRequest, res: Response) {
    try {
      const request = await FinancingService.disburseFinancing(
        req.params.id as string,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Financing disbursed successfully",
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await FinancingService.getStats();

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

export default new FinancingController();
