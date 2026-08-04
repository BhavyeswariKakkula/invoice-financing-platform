import User from "../models/User";
import { IUser } from "../interface/IUser";

class UserRepository {
  async createUser(userData: Partial<IUser>) {
    return await User.create(userData);
  }

  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async findById(id: string) {
    return await User.findById(id);
  }

  async updateById(id: string, updateData: Partial<IUser>) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findAll(filter: Record<string, any> = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password -refreshToken -emailVerificationOTP -passwordResetOTP")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async countDocuments(filter: Record<string, any> = {}) {
    return await User.countDocuments(filter);
  }

  async deleteById(id: string) {
    return await User.findByIdAndDelete(id);
  }
}

export default new UserRepository();
