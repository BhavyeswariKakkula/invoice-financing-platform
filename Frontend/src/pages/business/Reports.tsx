import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { reportAPI } from '../../api';
import { useAppSelector } from '../../store/hooks';
import toast from 'react-hot-toast';
import { HiOutlineDownload } from 'react-icons/hi';

const Reports: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const businessTabs = [
    { key: 'invoices', label: 'Invoice Report' },
    { key: 'financing', label: 'Financing Report' },
    { key: 'repayments', label: 'Repayment Report' },
  ];

  const adminTabs = [
    ...businessTabs,
    { key: 'businesses', label: 'Business Report' },
    { key: 'revenue', label: 'Revenue Report' },
  ];

  const tabs = isAdmin ? adminTabs : businessTabs;

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      let response;
      switch (type) {
        case 'invoices': response = await reportAPI.getInvoices(params); break;
        case 'financing': response = await reportAPI.getFinancing(params); break;
        case 'repayments': response = await reportAPI.getRepayments(params); break;
        case 'businesses': response = await reportAPI.getBusinesses(params); break;
        case 'revenue': response = await reportAPI.getRevenue(params); break;
        default: response = await reportAPI.getInvoices(params);
      }
      setReportData(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData?.records?.length) {
      if (reportData?.reportType === 'Revenue Report') {
        const csv = `Metric,Value\nTotal Financed,${reportData.totalFinanced}\nTotal Collected,${reportData.totalCollected}\nOutstanding,${reportData.totalOutstanding}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Revenue_Report.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report downloaded!');
        return;
      }
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(reportData.records[0]).filter(k => !k.startsWith('_') && k !== '__v');
    const csvContent = [
      headers.join(','),
      ...reportData.records.map((row: any) =>
        headers.map(h => {
          const val = typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h];
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.reportType.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setReportData(null); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {activeTab !== 'revenue' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </>
            )}
            <div className="flex items-end gap-2">
              <button onClick={() => fetchReport(activeTab)} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {reportData && (
                <button onClick={downloadCSV} className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <HiOutlineDownload className="w-4 h-4" />
                  CSV
                </button>
              )}
            </div>
          </div>

          {reportData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">{reportData.reportType} - {reportData.totalRecords || 0} records</p>
                <p className="text-xs text-gray-400">Generated: {new Date(reportData.generatedAt).toLocaleString('en-IN')}</p>
              </div>

              {activeTab === 'revenue' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600">Total Financed</p>
                    <p className="text-2xl font-bold text-green-700">₹{(reportData.totalFinanced || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600">Total Collected</p>
                    <p className="text-2xl font-bold text-blue-700">₹{(reportData.totalCollected || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="text-2xl font-bold text-red-700">₹{(reportData.totalOutstanding || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ) : reportData.records?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(reportData.records[0]).filter(k => !k.startsWith('_') && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt').slice(0, 8).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.records.slice(0, 50).map((record: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.keys(record).filter(k => !k.startsWith('_') && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt').slice(0, 8).map((key) => (
                            <td key={key} className="px-4 py-2 text-gray-600 max-w-[150px] truncate">
                              {typeof record[key] === 'object' ? JSON.stringify(record[key]) : String(record[key] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No records found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
