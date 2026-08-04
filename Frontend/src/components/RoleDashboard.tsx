import React from 'react';
import { useAppSelector } from '../store/hooks';
import BusinessDashboard from '../pages/business/Dashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

const RoleDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <BusinessDashboard />;
};

export default RoleDashboard;
