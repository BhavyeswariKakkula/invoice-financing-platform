import { Request, Response } from "express";
import UserService from "../services/UserService";
import { AuthRequest } from "../middleware/auth";

class UserController {
  async register(req: Request, res: Response) {
    try {
      const user = await UserService.registerUser(req.body);

      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        data: user,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await UserService.loginUser(email, password);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          token: result.token,
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

  async refreshToken(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Refresh token required",
        });
        return;
      }

      const result = await UserService.refreshToken(token);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: { token: result.token },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await UserService.forgotPassword(email);

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

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await UserService.resetPassword(email, otp, newPassword);

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

  async verifyEmail(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await UserService.verifyEmail(email, otp);

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

  async sendVerificationOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await UserService.sendVerificationOTP(email);

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

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.getProfile(req.user!.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      await UserService.logout(req.user!.id);

      res.clearCookie("refreshToken");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
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

export default new UserController();
