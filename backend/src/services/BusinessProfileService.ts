import BusinessProfileRepository from "../repositories/BusinessProfileRepository";
import { IBusinessProfile } from "../interface/IBusinessProfile";
import { AppError } from "../middleware/errorHandler";
import { cacheService } from "./RedisService";

class BusinessProfileService {
  async createProfile(userId: string, profileData: Partial<IBusinessProfile>) {
    const existing = await BusinessProfileRepository.findByUserId(userId);

    if (existing) {
      throw new AppError("Business profile already exists", 400);
    }

    const profile = await BusinessProfileRepository.createProfile({
      ...profileData,
      userId: userId as any,
    });

    await cacheService.del(`profile:${userId}`);

    return profile;
  }

  async getProfile(userId: string) {
    const cached = await cacheService.getObject<IBusinessProfile>(`profile:${userId}`);
    if (cached) return cached;

    const profile = await BusinessProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new AppError("Business profile not found", 404);
    }

    await cacheService.setObject(`profile:${userId}`, profile.toObject(), 3600);

    return profile;
  }

  async updateProfile(userId: string, updateData: Partial<IBusinessProfile>) {
    const profile = await BusinessProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new AppError("Business profile not found", 404);
    }

    const updated = await BusinessProfileRepository.updateById(
      profile._id.toString(),
      updateData
    );

    await cacheService.del(`profile:${userId}`);

    return updated;
  }

  async getProfileById(profileId: string) {
    const profile = await BusinessProfileRepository.findById(profileId);

    if (!profile) {
      throw new AppError("Business profile not found", 404);
    }

    return profile;
  }

  async getAllProfiles(page: number = 1, limit: number = 10, status?: string) {
    const filter: Record<string, any> = {};
    if (status) filter.verificationStatus = status;

    return await BusinessProfileRepository.findAll(filter, page, limit);
  }

  async verifyProfile(
    profileId: string,
    status: "verified" | "rejected",
    remarks?: string
  ) {
    const profile = await BusinessProfileRepository.findById(profileId);

    if (!profile) {
      throw new AppError("Business profile not found", 404);
    }

    if (status === "verified" && profile.verificationStatus === "verified") {
      throw new AppError("Business profile is already verified", 400);
    }

    const updated = await BusinessProfileRepository.updateById(profileId, {
      verificationStatus: status,
      verificationRemarks: remarks,
    } as any);

    await cacheService.del(`profile:${profile.userId.toString()}`);

    return updated;
  }
}

export default new BusinessProfileService();
