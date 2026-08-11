import TaxConfig from "../models/TaxConfig";
import { ITaxConfig } from "../interface/ITaxConfig";

class TaxConfigRepository {
  async create(data: Partial<ITaxConfig>) {
    return await TaxConfig.create(data);
  }

  async findById(id: string) {
    return await TaxConfig.findById(id);
  }

  async findAll() {
    return await TaxConfig.find().sort({ createdAt: -1 });
  }

  async findActive() {
    return await TaxConfig.find({ isActive: true });
}

  async updateById(id: string, data: Partial<ITaxConfig>) {
    return await TaxConfig.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string) {
    return await TaxConfig.findByIdAndDelete(id);
  }

  async deactivateAll() {
    return await TaxConfig.updateMany({ isActive: true }, { isActive: false });
  }
}

export default new TaxConfigRepository();
