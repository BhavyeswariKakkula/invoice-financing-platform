import TaxConfigRepository from "../repositories/TaxConfigRepository";
import { ITaxConfig } from "../interface/ITaxConfig";
import { AppError } from "../middleware/errorHandler";

class TaxConfigService {
  async createTaxConfig(adminId: string, data: { taxName: string; taxPercentage: number }) {
    const existing = await TaxConfigRepository.findActive();
    const isActive = !existing;

    return await TaxConfigRepository.create({
      taxName: data.taxName,
      taxPercentage: data.taxPercentage,
      isActive,
      createdBy: adminId as any,
    });
  }

  async getAllTaxConfigs() {
    return await TaxConfigRepository.findAll();
  }

  async getActiveTaxConfig() {
  const configs = await TaxConfigRepository.findActive();

  return configs;
}

  async updateTaxConfig(configId: string, data: { taxName?: string; taxPercentage?: number }) {
    const config = await TaxConfigRepository.findById(configId);

    if (!config) {
      throw new AppError("Tax configuration not found", 404);
    }

    return await TaxConfigRepository.updateById(configId, data);
  }

  async toggleTaxConfig(configId: string) {
    const config = await TaxConfigRepository.findById(configId);

    if (!config) {
      throw new AppError("Tax configuration not found", 404);
    }

    if (!config.isActive) {
      await TaxConfigRepository.deactivateAll();
    }

    return await TaxConfigRepository.updateById(configId, {
      isActive: !config.isActive,
    });
  }

  async deleteTaxConfig(configId: string) {
    const config = await TaxConfigRepository.findById(configId);

    if (!config) {
      throw new AppError("Tax configuration not found", 404);
    }

    await TaxConfigRepository.deleteById(configId);
    return { message: "Tax configuration deleted" };
  }
}

export default new TaxConfigService();
