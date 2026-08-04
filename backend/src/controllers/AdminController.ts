import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import UserRepository from "../repositories/UserRepository";
import BusinessProfileService from "../services/BusinessProfileService";
import { AppError } from "../middleware/errorHandler";

class AdminController {
  async getAllBusinesses(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const filter: Record<string, any> = { role: "business" };
      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
        ];
      }

      const result = await UserRepository.findAll(filter, page, limit);

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

  async getBusinessById(req: AuthRequest, res: Response) {
    try {
      const user = await UserRepository.findById(req.params.id as string);

      if (!user) {
        throw new AppError("Business not found", 404);
      }

      const profile = await BusinessProfileService.getProfile(req.params.id as string);

      res.status(200).json({
        success: true,
        data: { user, profile },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async toggleBusinessVerification(req: AuthRequest, res: Response) {
    try {
      const user = await UserRepository.findById(req.params.id as string);

      if (!user) {
        throw new AppError("Business not found", 404);
      }

      const updated = await UserRepository.updateById(req.params.id as string, {
        isVerified: !user.isVerified,
      } as any);

      res.status(200).json({
        success: true,
        message: `Business ${updated?.isVerified ? "verified" : "unverified"} successfully`,
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

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const user = await UserRepository.findById(req.params.id as string);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role === "admin") {
        throw new AppError("Cannot delete admin users", 400);
      }

      await UserRepository.deleteById(req.params.id as string);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
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
      const totalUsers = await UserRepository.countDocuments();
      const totalBusinesses = await UserRepository.countDocuments({ role: "business" });
      const verifiedBusinesses = await UserRepository.countDocuments({
        role: "business",
        isVerified: true,
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalBusinesses,
          verifiedBusinesses,
          unverifiedBusinesses: totalBusinesses - verifiedBusinesses,
        },
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

export default new AdminController();
