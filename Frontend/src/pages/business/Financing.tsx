import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { financingAPI, invoiceAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const Financing: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [verifiedInvoices, setVerifiedInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    invoiceId: '',
    requestedAmount: '',
    tenureMonths: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await financingAPI.getMy(params);
      setRequests(data.data.requests);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load financing requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedInvoices = async () => {
    try {
      const { data } = await invoiceAPI.getMy({ status: 'verified', limit: 50 });
      setVerifiedInvoices(data.data.invoices);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchVerifiedInvoices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financingAPI.apply({
        invoiceId: formData.invoiceId,
        requestedAmount: Number(formData.requestedAmount),
        tenureMonths: Number(formData.tenureMonths),
        remarks: formData.remarks || undefined,
      });
      toast.success('Financing request submitted!');
      setShowModal(false);
      setFormData({ invoiceId: '', requestedAmount: '', tenureMonths: '', remarks: '' });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Financing Requests</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <HiOutlinePlus className="w-5 h-5" />
            New Request
          </button>
        </div>

        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disbursed">Disbursed</option>
            <option value="repayment">Repayment</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : requests.length === 0 ? (
          <EmptyState title="No financing requests" message="Create your first financing request" action={<button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Apply Now</button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{req.invoiceId?.invoiceNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{(req.approvedAmount || req.requestedAmount)?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.interestRate > 0 ? `${req.interestRate}%` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.processingFee > 0 ? `₹${req.processingFee.toLocaleString('en-IN')}` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.tenureMonths} months</td>
                      <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Financing">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Verified Invoice</label>
            <select value={formData.invoiceId} onChange={(e) => {
  const selectedInvoice = verifiedInvoices.find(
    (inv) => inv._id === e.target.value
  );

  setFormData({
    ...formData,
    invoiceId: e.target.value,
    requestedAmount: selectedInvoice?.totalAmount || 0,
  });
}} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
              <option value="">Select a verified invoice</option>
              {verifiedInvoices.map((inv) => (
                <option key={inv._id} value={inv._id}>{inv.invoiceNumber} - ₹{inv.totalAmount?.toLocaleString('en-IN')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount</label>
              <input type="number" value={formData.requestedAmount} 
              readOnly 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (months)</label>
              <input type="number" value={formData.tenureMonths} onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required min="1" max="36" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Financing;
