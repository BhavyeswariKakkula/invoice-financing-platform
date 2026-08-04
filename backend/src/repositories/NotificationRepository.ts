import Notification from "../models/Notification";
import { INotification } from "../interface/INotification";

class NotificationRepository {
  async createNotification(data: Partial<INotification>) {
    return await Notification.create(data);
  }

  async findById(id: string) {
    return await Notification.findById(id);
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const total = await Notification.countDocuments({ userId });
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { notifications, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findUnreadByUser(userId: string) {
    return await Notification.find({ userId, isRead: false })
      .sort({ createdAt: -1 });
  }

  async markAsRead(id: string) {
    return await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async countUnread(userId: string) {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  async deleteById(id: string) {
    return await Notification.findByIdAndDelete(id);
  }

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    return await Notification.deleteMany({ createdAt: { $lt: cutoff } });
  }
}

export default new NotificationRepository();
