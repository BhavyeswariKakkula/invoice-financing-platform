import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import RoleDashboard from './components/RoleDashboard';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

import Invoices from './pages/business/Invoices';
import Financing from './pages/business/Financing';
import Repayments from './pages/business/Repayments';
import Profile from './pages/business/Profile';
import Notifications from './pages/business/Notifications';
import Reports from './pages/business/Reports';

import Businesses from './pages/admin/Businesses';
import AdminInvoices from './pages/admin/AdminInvoices';
import TaxManagement from './pages/admin/TaxManagement';
import Verifications from './pages/admin/Verifications';
import AdminFinancing from './pages/admin/AdminFinancing';
import AdminRepayments from './pages/admin/AdminRepayments';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['business', 'admin']}>
              <RoleDashboard />
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute allowedRoles={['business']}>
              <Invoices />
            </ProtectedRoute>
          } />
          <Route path="/financing" element={
            <ProtectedRoute allowedRoles={['business']}>
              <Financing />
            </ProtectedRoute>
          } />
          <Route path="/repayments" element={
            <ProtectedRoute allowedRoles={['business']}>
              <Repayments />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['business']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['business', 'admin']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['business', 'admin']}>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/admin/businesses" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Businesses />
            </ProtectedRoute>
          } />
          <Route path="/admin/invoices" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminInvoices />
            </ProtectedRoute>
          } />
          <Route path="/admin/verifications" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Verifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/financing" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFinancing />
            </ProtectedRoute>
          } />
          <Route path="/admin/repayments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRepayments />
            </ProtectedRoute>
          } />
          <Route path="/admin/tax-config" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TaxManagement />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
