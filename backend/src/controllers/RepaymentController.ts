import { Response } from "express";
import RepaymentService from "../services/RepaymentService";
import { AuthRequest } from "../middleware/auth";

class RepaymentController {
  async submitPayment(req: AuthRequest, res: Response) {
    try {
      const paymentProof = req.file
        ? `/uploads/payments/${req.file.filename}`
        : undefined;

      const updated = await RepaymentService.submitPayment(
        req.body.repaymentId,
        req.user!.id,
        {
          amount: req.body.amount,
          paymentType: req.body.paymentType,
          prepayInstallments: req.body.prepayInstallments,
          paymentMethod: req.body.paymentMethod,
          transactionId: req.body.transactionId,
          paymentProof,
          remarks: req.body.remarks,
        }
      );

      res.status(200).json({
        success: true,
        message: "Payment submitted for verification",
        data: updated,
      });
    } catch (error: any) {
  console.error("FULL ERROR:", error);

  const statusCode = error.statusCode || 400;

  res.status(statusCode).json({
    success: false,
    message: error.message,
  });
}
  }

  async getMyRepayments(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await RepaymentService.getMyRepayments(
        req.user!.id,
        page,
        limit,
        status,
        search
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRepayment(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === "admin";
      const repayment = await RepaymentService.getRepaymentById(
        String(req.params.id),
        isAdmin ? undefined : req.user!.id,
        isAdmin
      );

      res.status(200).json({ success: true, data: repayment });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getSchedule(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === "admin";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const status = req.query.status as string | undefined;

      const result = await RepaymentService.getSchedule(
        String(req.params.id),
        isAdmin ? undefined : req.user!.id,
        isAdmin,
        page,
        limit,
        status
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getEarlyClosureQuote(req: AuthRequest, res: Response) {
    try {
      const quote = await RepaymentService.getEarlyClosureQuote(
        String(req.params.id),
        req.user!.id
      );

      res.status(200).json({ success: true, data: quote });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getDashboardSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await RepaymentService.getDashboardSummary(req.user!.id);

      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllRepayments(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      const result = await RepaymentService.getAllRepayments(
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const updated = await RepaymentService.verifyPayment(
        String(req.params.id),
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Repayment verified successfully",
        data: updated,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rejectPayment(req: AuthRequest, res: Response) {
    try {
      const updated = await RepaymentService.rejectPayment(
        String(req.params.id),
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: "Payment rejected successfully",
        data: updated,
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
      const isAdmin = req.user!.role === "admin";

      if (isAdmin) {
        const stats = await RepaymentService.getAdminStats();
        res.status(200).json({ success: true, data: stats });
        return;
      }

      const stats = await RepaymentService.getStats(req.user!.id);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new RepaymentController();
