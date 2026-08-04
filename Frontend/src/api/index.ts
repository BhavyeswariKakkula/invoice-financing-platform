import API from './axios';

export const authAPI = {
  register: (data: any) => API.post('/users/register', data),
  login: (data: any) => API.post('/users/login', data),
  logout: () => API.post('/users/logout'),
  refreshToken: (token: string) => API.post('/users/refresh-token', { refreshToken: token }),
  forgotPassword: (email: string) => API.post('/users/forgot-password', { email }),
  resetPassword: (data: any) => API.post('/users/reset-password', data),
  verifyEmail: (data: any) => API.post('/users/verify-email', data),
  sendVerificationOTP: (email: string) => API.post('/users/send-verification-otp', { email }),
  getProfile: () => API.get('/users/profile'),
};

export const businessProfileAPI = {
  getProfile: () => API.get('/business-profile'),
  createProfile: (data: any) => API.post('/business-profile', data),
  updateProfile: (data: any) => API.put('/business-profile', data),
  getAllProfiles: (params?: any) => API.get('/business-profile/all', { params }),
  verifyProfile: (id: string, data: any) => API.put(`/business-profile/verify/${id}`, data),
};

export const invoiceAPI = {
  create: (data: any) => API.post('/invoices', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: (params?: any) => API.get('/invoices/my', { params }),
  getAll: (params?: any) => API.get('/invoices/all', { params }),
  getById: (id: string) => API.get(`/invoices/${id}`),
  update: (id: string, data: any) => API.put(`/invoices/${id}`, data),
  delete: (id: string) => API.delete(`/invoices/${id}`),
  submit: (id: string) => API.put(`/invoices/${id}/submit`),
  getStats: () => API.get('/invoices/stats'),
};

export const verificationAPI = {
  verify: (id: string, data: any) => API.post(`/verifications/${id}/verify`, data),
  getByInvoice: (id: string) => API.get(`/verifications/invoice/${id}`),
  getAll: (params?: any) => API.get('/verifications/all', { params }),
  getStats: () => API.get('/verifications/stats'),
};

export const financingAPI = {
  apply: (data: any) => API.post('/financing/apply', data),
  getMy: (params?: any) => API.get('/financing/my', { params }),
  getById: (id: string) => API.get(`/financing/${id}`),
  getAll: (params?: any) => API.get('/financing/all', { params }),
  approve: (id: string, data: any) => API.patch(`/financing/${id}/approve`, data),
  reject: (id: string, data: any) => API.patch(`/financing/${id}/reject`, data),
  disburse: (id: string) => API.patch(`/financing/${id}/disburse`),
  getStats: () => API.get('/financing/stats'),
};

export const repaymentAPI = {
  submitPayment: (data: any) => API.post('/repayments/pay', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: (params?: any) => API.get('/repayments/my', { params }),
  getById: (id: string) => API.get(`/repayments/${id}`),
  getSchedule: (id: string, params?: any) => API.get(`/repayments/${id}/schedule`, { params }),
  getQuote: (id: string) => API.get(`/repayments/${id}/quote`),
  getSummary: () => API.get('/repayments/summary'),
  getAll: (params?: any) => API.get('/repayments/admin', { params }),
  verify: (id: string) => API.put(`/repayments/admin/${id}/verify`),
  reject: (id: string, data: any) => API.put(`/repayments/admin/${id}/reject`, data),
  getStats: () => API.get('/repayments/stats'),
};

export const notificationAPI = {
  getAll: (params?: any) => API.get('/notifications', { params }),
  getUnread: () => API.get('/notifications/unread'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id: string) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
  delete: (id: string) => API.delete(`/notifications/${id}`),
};

export const dashboardAPI = {
  getBusiness: () => API.get('/dashboard/business'),
  getAdmin: () => API.get('/dashboard/admin'),
};

export const reportAPI = {
  getInvoices: (params?: any) => API.get('/reports/invoices', { params }),
  getFinancing: (params?: any) => API.get('/reports/financing', { params }),
  getRepayments: (params?: any) => API.get('/reports/repayments', { params }),
  getBusinesses: (params?: any) => API.get('/reports/businesses', { params }),
  getRevenue: (params?: any) => API.get('/reports/revenue', { params }),
};

export const taxConfigAPI = {
  getActive: () => API.get('/tax-config/active'),
  getAll: () => API.get('/tax-config'),
  create: (data: any) => API.post('/tax-config', data),
  update: (id: string, data: any) => API.put(`/tax-config/${id}`, data),
  toggle: (id: string) => API.patch(`/tax-config/${id}/toggle`),
  delete: (id: string) => API.delete(`/tax-config/${id}`),
};

export const adminAPI = {
  getBusinesses: (params?: any) => API.get('/admin/businesses', { params }),
  getBusinessById: (id: string) => API.get(`/admin/businesses/${id}`),
  toggleVerification: (id: string) => API.put(`/admin/businesses/${id}/toggle-verification`),
  deleteUser: (id: string) => API.delete(`/admin/businesses/${id}`),
  getStats: () => API.get('/admin/stats'),
};
