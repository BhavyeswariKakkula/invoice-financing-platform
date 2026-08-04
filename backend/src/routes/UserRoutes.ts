import { Router } from "express";
import UserController from "../controllers/UserController";
import authMiddleware from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimiter";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
} from "../validations/authValidation";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  registerValidation,
  UserController.register
);

router.post(
  "/login",
  //authRateLimiter,
  loginValidation,
  UserController.login
);

router.post("/refresh-token", UserController.refreshToken);

router.post(
  "/forgot-password",
  authRateLimiter,
  forgotPasswordValidation,
  UserController.forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidation,
  UserController.resetPassword
);

router.post(
  "/verify-email",
  authRateLimiter,
  verifyEmailValidation,
  UserController.verifyEmail
);

router.post(
  "/send-verification-otp",
  authRateLimiter,
  UserController.sendVerificationOTP
);

router.get("/profile", authMiddleware, UserController.getProfile);

router.post("/logout", authMiddleware, UserController.logout);

export default router;
