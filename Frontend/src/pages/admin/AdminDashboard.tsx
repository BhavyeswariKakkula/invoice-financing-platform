import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getAdminDashboard } from '../../store/slices/dashboardSlice';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getAdminDashboard());
  }, [dispatch]);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!data) return <Layout><p>No data</p></Layout>;

  const { cards, charts } = data;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Businesses" value={cards.totalBusinesses} icon={<HiOutlineUserGroup className="w-6 h-6" />} color="primary" />
           <StatCard title="Total Invoices" value={cards.totalInvoices} icon={<HiOutlineDocumentText className="w-6 h-6" />} color="blue" />
          <StatCard title="Active Loans" value={cards.activeLoans} icon={<HiOutlineClock className="w-6 h-6" />} color="blue" />
          <StatCard title="Completed Loans" value={cards.completedLoans} icon={<HiOutlineCheckCircle className="w-6 h-6" />} color="green" />
          
        </div>

        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Financed" value={`₹${(cards.totalFinancedAmount || 0).toLocaleString('en-IN')}`} icon={<HiOutlineCurrencyDollar   className="w-6 h-6" />} color="purple" />
          <StatCard title="Total Collected" value={`₹${(cards.totalPaidAmount || 0).toLocaleString('en-IN')}`} icon={<HiOutlineCheckCircle className="w-6 h-6" />} color="green" />
          <StatCard title="Outstanding" value={`₹${(cards.totalOutstanding || 0).toLocaleString('en-IN')}`} icon={<HiOutlineExclamationCircle className="w-6 h-6" />} color="red" />
           <StatCard title="Interest Earned" value={`₹${(cards.interestEarned || 0).toLocaleString('en-IN')}`} icon={<HiOutlineCurrencyDollar className="w-6 h-6" />} color="green" />
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
         
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
            {charts.invoiceStatusDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.invoiceStatusDistribution.map((item: any) => ({
                      name: item._id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                      value: item.count,
                    }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                  >
                    {charts.invoiceStatusDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Stats</h3>
            {charts.verificationStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-semibold text-green-600">{charts.verificationStats.approved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="font-semibold text-red-600">{charts.verificationStats.rejected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Requires Correction</span>
                  <span className="font-semibold text-yellow-600">{charts.verificationStats.requiresCorrection}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Avg. Verification Time</p>
                  <p className="text-xl font-bold text-gray-900">{charts.verificationStats.averageVerificationTime}h</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financing Volume</h3>
          {charts.monthlyFinancing?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.monthlyFinancing.map((item: any) => ({
                name: `${item._id.month}/${item._id.year}`,
                amount: item.totalAmount || 0,
                count: item.count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
