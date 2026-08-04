import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getBusinessDashboard } from '../../store/slices/dashboardSlice';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getBusinessDashboard());
  }, [dispatch]);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!data) return <Layout><p>No data</p></Layout>;

  const { cards, charts } = data;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoices"
            value={cards.totalInvoices}
            icon={<HiOutlineDocumentText className="w-6 h-6" />}
            color="primary"
          />
          
          <StatCard
            title="Total Financed"
            value={`₹${(cards.totalFinanced || 0).toLocaleString('en-IN')}`}
            icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Outstanding Balance"
            value={`₹${(cards.totalOutstanding || 0).toLocaleString('en-IN')}`}
            icon={<HiOutlineExclamationCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="EMIs Paid"
    value={`${cards.emisPaid || 0} / ${cards.totalInstallments || 0}`}
    icon={<HiOutlineCheckCircle className="w-6 h-6" />}
    color="green"
  />
  <StatCard
    title="EMIs Remaining"
    value={cards.emisRemaining || 0}
    icon={<HiOutlineClock className="w-6 h-6" />}
    color="yellow"
  />
  <StatCard
    title="Current EMI"
    value={`₹${(cards.currentEmi || 0).toLocaleString('en-IN')}`}
    icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
    color="purple"
  />
  <StatCard
    title="Next Due Date"
    value={cards.nextRepaymentDueDate
      ? new Date(cards.nextRepaymentDueDate).toLocaleDateString('en-IN')
      : '—'}
    icon={<HiOutlineClock className="w-6 h-6" />}
    color="yellow"
  />
</div>
        

        {typeof cards.loanProgressPercent === 'number' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Loan Progress</p>
              <p className="text-sm font-semibold text-gray-900">{cards.loanProgressPercent.toFixed(1)}%</p>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, cards.loanProgressPercent)}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status Distribution</h3>
            {charts.statusDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.statusDistribution.map((item: any) => ({
                      name: item._id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.statusDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
            {charts.monthlyFinancing?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.monthlyFinancing.map((item: any) => ({
                  name: `${item._id.month}/${item._id.year}`,
                  count: item.count,
                  amount: item.totalAmount,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
