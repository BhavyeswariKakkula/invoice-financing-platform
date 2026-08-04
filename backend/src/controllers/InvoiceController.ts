import { Response } from "express";
import InvoiceService from "../services/InvoiceService";
import { AuthRequest } from "../middleware/auth";

class InvoiceController {
  async createInvoice(req: AuthRequest, res: Response) {
    try {
      const invoice = await InvoiceService.createInvoice(
        req.user!.id,
        req.body,
        req.file
      );

      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInvoice(req: AuthRequest, res: Response) {
    try {
      const invoice = await InvoiceService.getInvoiceById(
        req.params.id as string,
        req.user!.role === "admin" ? undefined : req.user!.id
      );

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateInvoice(req: AuthRequest, res: Response) {
    try {
      const invoice = await InvoiceService.updateInvoice(
        req.params.id as string,
        req.user!.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteInvoice(req: AuthRequest, res: Response) {
    try {
      const result = await InvoiceService.deleteInvoice(
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

  async submitInvoice(req: AuthRequest, res: Response) {
    try {
      const invoice = await InvoiceService.submitInvoice(
        req.params.id as string,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Invoice submitted for verification",
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserInvoices(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await InvoiceService.getUserInvoices(
        req.user!.id,
        page,
        limit,
        status,
        search
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

  async getAllInvoices(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await InvoiceService.getAllInvoices(
        page,
        limit,
        status,
        search
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

  async getInvoiceStats(req: AuthRequest, res: Response) {
    try {
      const userId =
        req.user!.role === "admin" ? undefined : req.user!.id;
      const stats = await InvoiceService.getInvoiceStats(userId);

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

export default new InvoiceController();
