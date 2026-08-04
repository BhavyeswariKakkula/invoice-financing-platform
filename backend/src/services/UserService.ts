import UserRepository from "../repositories/UserRepository";
import { IUser } from "../interface/IUser";
import bcrypt from "bcryptjs";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { generateOTP } from "../utils/helpers";
import emailService from "./EmailService";
import { otpService } from "./RedisService";
import { AppError } from "../middleware/errorHandler";

class UserService {
  async registerUser(userData: Partial<IUser>) {
    const existingUser = await UserRepository.findByEmail(userData.email!);

    if (existingUser) {
      throw new AppError("User already exists with this email", 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    userData.password = hashedPassword;

    const user = await UserRepository.createUser(userData);

    const otp = generateOTP();

try {
  await otpService.setWithExpiry(`email-verify:${userData.email}`, otp, 600);

  await emailService.sendVerificationEmail(
    userData.email!,
    userData.fullName!,
    otp
  );
} catch (e) {
  console.error("OTP/Redis/Email skipped:", e);
}

    const { password, refreshToken, ...userObj } = user.toObject();

    return userObj;
  }

    async loginUser(email: string, inputPassword: string) {
      const user = await UserRepository.findByEmail(email);

      if (!user) {
        throw new AppError("Invalid email or password", 401);
      }

      const isMatch = await bcrypt.compare(inputPassword, user.password);

      if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
      }

    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await UserRepository.updateById(user._id.toString(), {
      refreshToken,
      lastLogin: new Date(),
    } as any);

    const { password: _pw, refreshToken: _rt, emailVerificationOTP: _evo, passwordResetOTP: _pro, ...userObj } = user.toObject();

    return { user: userObj, token, refreshToken };
  }

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);
    const user = await UserRepository.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new AppError("Invalid refresh token", 401);
    }

    const newAccessToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    await UserRepository.updateById(user._id.toString(), {
      refreshToken: newRefreshToken,
    } as any);

    return { token: newAccessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("No account found with this email", 404);
    }

    const otp = generateOTP();
    await otpService.setWithExpiry(`password-reset:${email}`, otp, 600);

    try {
      await emailService.sendPasswordResetEmail(email, user.fullName, otp);
    } catch (e) {
      console.error("Failed to send password reset email:", e);
    }

    return { message: "Password reset OTP sent to your email" };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const storedOTP = await otpService.get(`password-reset:${email}`);

    if (!storedOTP || storedOTP !== otp) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserRepository.updateById(user._id.toString(), {
      password: hashedPassword,
      refreshToken: null,
    } as any);

    await otpService.del(`password-reset:${email}`);

    return { message: "Password reset successful" };
  }

  async verifyEmail(email: string, otp: string) {
    const storedOTP = await otpService.get(`email-verify:${email}`);

    if (!storedOTP || storedOTP !== otp) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await UserRepository.updateById(user._id.toString(), {
      isVerified: true,
    } as any);

    await otpService.del(`email-verify:${email}`);

    return { message: "Email verified successfully" };
  }

  async sendVerificationOTP(email: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isVerified) {
      throw new AppError("Email is already verified", 400);
    }

    const otp = generateOTP();
    await otpService.setWithExpiry(`email-verify:${email}`, otp, 600);

    try {
      await emailService.sendVerificationEmail(email, user.fullName, otp);
    } catch (e) {
      console.error("Failed to send verification email:", e);
    }

    return { message: "Verification OTP sent to your email" };
  }

  async getProfile(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { password, refreshToken, emailVerificationOTP, passwordResetOTP, ...userObj } = user.toObject();

    return userObj;
  }

  async logout(userId: string) {
    await UserRepository.updateById(userId, {
      refreshToken: null,
    } as any);

    return { message: "Logged out successfully" };
  }
}

export default new UserService();
