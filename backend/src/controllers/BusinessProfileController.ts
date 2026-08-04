import { Response } from "express";
import BusinessProfileService from "../services/BusinessProfileService";
import { AuthRequest } from "../middleware/auth";

class BusinessProfileController {
  async createProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await BusinessProfileService.createProfile(
        req.user!.id,
        req.body
      );
      
      res.status(201).json({
        success: true,
        message: "Business profile created successfully",
        data: profile,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await BusinessProfileService.getProfile(req.user!.id);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await BusinessProfileService.updateProfile(
        req.user!.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllProfiles(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await BusinessProfileService.getAllProfiles(
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

  async verifyProfile(req: AuthRequest, res: Response) {
    try {
      const { status, remarks } = req.body;
      const profile = await BusinessProfileService.verifyProfile(
        req.params.id as string,
        status,
        remarks
      );

      res.status(200).json({
        success: true,
        message: `Profile ${status} successfully`,
        data: profile,
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

export default new BusinessProfileController();
