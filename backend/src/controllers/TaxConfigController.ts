import { Response } from "express";
import TaxConfigService from "../services/TaxConfigService";
import { AuthRequest } from "../middleware/auth";

class TaxConfigController {
  async createTaxConfig(req: AuthRequest, res: Response) {
    try {
      const config = await TaxConfigService.createTaxConfig(req.user!.id, {
        taxName: req.body.taxName,
        taxPercentage: req.body.taxPercentage,
      });

      res.status(201).json({
        success: true,
        message: "Tax configuration created",
        data: config,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllTaxConfigs(req: AuthRequest, res: Response) {
    try {
      const configs = await TaxConfigService.getAllTaxConfigs();

      res.status(200).json({
        success: true,
        data: configs,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getActiveTaxConfig(req: AuthRequest, res: Response) {
    try {
      const config = await TaxConfigService.getActiveTaxConfig();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateTaxConfig(req: AuthRequest, res: Response) {
    try {
      const config = await TaxConfigService.updateTaxConfig(
        req.params.id as string,
        {
          taxName: req.body.taxName,
          taxPercentage: req.body.taxPercentage,
        }
      );

      res.status(200).json({
        success: true,
        message: "Tax configuration updated",
        data: config,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async toggleTaxConfig(req: AuthRequest, res: Response) {
    try {
      const config = await TaxConfigService.toggleTaxConfig(
        req.params.id as string
      );

      res.status(200).json({
        success: true,
        message: `Tax configuration ${config?.isActive ? "activated" : "deactivated"}`,
        data: config,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteTaxConfig(req: AuthRequest, res: Response) {
    try {
      const result = await TaxConfigService.deleteTaxConfig(
        req.params.id as string
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

export default new TaxConfigController();
