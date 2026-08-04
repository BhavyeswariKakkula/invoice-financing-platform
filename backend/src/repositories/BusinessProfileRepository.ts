import BusinessProfile from "../models/BusinessProfile";
import { IBusinessProfile } from "../interface/IBusinessProfile";

class BusinessProfileRepository {
  async createProfile(profileData: Partial<IBusinessProfile>) {
    return await BusinessProfile.create(profileData);
  }

  async findByUserId(userId: string) {
    return await BusinessProfile.findOne({ userId });
  }

  async findById(id: string) {
    return await BusinessProfile.findById(id);
  }

  async updateById(id: string, updateData: Partial<IBusinessProfile>) {
    return await BusinessProfile.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async findAll(filter: Record<string, any> = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await BusinessProfile.countDocuments(filter);
    const profiles = await BusinessProfile.find(filter)
      .populate("userId", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { profiles, total, page, totalPages: Math.ceil(total / limit) };
  }

  async countDocuments(filter: Record<string, any> = {}) {
    return await BusinessProfile.countDocuments(filter);
  }
}

export default new BusinessProfileRepository();
