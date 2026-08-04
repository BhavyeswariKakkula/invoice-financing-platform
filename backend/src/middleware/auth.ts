  import { Request, Response, NextFunction } from "express";
  import { verifyToken } from "../utils/jwt";
  import UserRepository from "../repositories/UserRepository";

  export interface AuthRequest extends Request {
    user?: {
      id: string;
      role: string;
    };
  }

  const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          message: "Access denied. No token provided.",
        });
        return;
      }

      const token = authHeader.split(" ")[1];

console.log("Received Token:", token);

const decoded = verifyToken(token);

console.log("Decoded Token:", decoded);

const user = await UserRepository.findById(decoded.id);

console.log("User:", user);

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid token. User not found.",
        });
        return;
      }

      req.user = {
        id: user._id.toString(),
        role: user.role,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  };

  export default authMiddleware;
