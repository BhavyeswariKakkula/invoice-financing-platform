import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { notificationAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ page, limit: 20 });
      setNotifications(data.data.notifications);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.data.count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
      fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error(error);
    }
  };

  const typeIcons: Record<string, string> = {
    invoice_submitted: '📄',
    invoice_verified: '✅',
    financing_approved: '💰',
    repayment_completed: '🎉',
    system: '📢',
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
          <EmptyState title="No notifications" message="You're all caught up!" />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
                  !notif.isRead ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">{typeIcons[notif.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.isRead && (
                    <button onClick={() => handleMarkAsRead(notif._id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Mark as read">
                      <HiOutlineCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(notif._id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
