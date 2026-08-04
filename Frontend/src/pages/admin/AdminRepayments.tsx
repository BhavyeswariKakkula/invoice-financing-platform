import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { repaymentAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminRepayments: React.FC = () => {
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchRepayments = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await repaymentAPI.getAll(params);
      setRepayments(data.data.repayments);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load repayments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchRepayments();
  }, [page, statusFilter, search]);

  const handleVerify = async () => {
    setProcessing(true);
    try {
      await repaymentAPI.verify(selectedRepayment._id);
      toast.success('Payment verified');
      setShowVerifyModal(false);
      setSelectedRepayment(null);
      fetchRepayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await repaymentAPI.reject(selectedRepayment._id, { reason: rejectReason });
      toast.success('Payment rejected');
      setShowRejectModal(false);
      setSelectedRepayment(null);
      setRejectReason('');
      fetchRepayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const viewSchedule = async (repayment: any) => {
    setSelectedRepayment(repayment);
    setScheduleLoading(true);
    setSchedule([]);
    setShowScheduleModal(true);
    try {
      const { data } = await repaymentAPI.getSchedule(repayment._id, { limit: 100 });
      setSchedule(data.data.installments);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  const hasPending = (r: any) => (r.submittedAmount || 0) > 0;
  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All Loan Repayments</h1>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, invoice or transaction..."
            className="flex-1 min-w-[220px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="prepaid">Prepaid</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : repayments.length === 0 ? (
          <EmptyState title="No loans" message="No loan records match your filters" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMIs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {repayments.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{r.businessId?.fullName || r.businessId?.companyName || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.invoiceId?.invoiceNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatINR(r.disbursedAmount)}</td>
                      <td className="px-6 py-4 text-sm text-red-600">{formatINR(r.outstandingPrincipal)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{(r.emisPaid || 0)} / {r.totalInstallments}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {r.status === 'completed' || r.status === 'prepaid'
                          ? '—'
                          : r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString('en-IN') : new Date(r.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewSchedule(r)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Schedule
                          </button>
                          {hasPending(r) && (
                            <>
                              <button
                                onClick={() => { setSelectedRepayment(r); setShowVerifyModal(true); }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => { setSelectedRepayment(r); setRejectReason(''); setShowRejectModal(true); }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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

      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title="Verify Payment">
        {selectedRepayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-600">{selectedRepayment.businessId?.fullName || selectedRepayment.businessId?.companyName}</p>
              <p className="text-sm text-gray-600">Invoice #{selectedRepayment.invoiceId?.invoiceNumber}</p>
              <p className="text-lg font-bold text-gray-900">{formatINR(selectedRepayment.submittedAmount)} submitted</p>
              <p className="text-sm text-gray-600">
                Type: {selectedRepayment.submittedPaymentType === 'close' ? 'Full closure' : selectedRepayment.submittedPaymentType === 'prepay' ? `Prepay ${selectedRepayment.submittedInstallmentCount} EMI(s)` : 'Current EMI'}
              </p>
            </div>
            {selectedRepayment.paymentProof && (
              <a href={selectedRepayment.paymentProof} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 underline">
                View payment proof
              </a>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowVerifyModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleVerify} disabled={processing} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {processing ? 'Verifying...' : 'Confirm Verify'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Payment">
        {selectedRepayment && (
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-600">{selectedRepayment.businessId?.fullName || selectedRepayment.businessId?.companyName}</p>
              <p className="text-sm text-gray-600">Invoice #{selectedRepayment.invoiceId?.invoiceNumber}</p>
              <p className="text-lg font-bold text-gray-900">{formatINR(selectedRepayment.submittedAmount)} submitted</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={processing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="EMI Schedule">
        {selectedRepayment && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {selectedRepayment.businessId?.fullName || selectedRepayment.businessId?.companyName || ''} · Invoice #{selectedRepayment.invoiceId?.invoiceNumber || 'N/A'} · {selectedRepayment.totalInstallments} EMIs of {formatINR(selectedRepayment.emiAmount)}
            </p>
            {scheduleLoading ? <LoadingSpinner /> : schedule.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No installments found</p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Late Fee</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedule.map((inst) => (
                      <tr key={inst._id}>
                        <td className="px-3 py-2 text-gray-900">{inst.installmentNumber}</td>
                        <td className="px-3 py-2 text-gray-600">{new Date(inst.dueDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-3 py-2 text-gray-600">{formatINR(inst.principalAmount)}</td>
                        <td className="px-3 py-2 text-gray-600">{formatINR(inst.interestAmount)}</td>
                        <td className="px-3 py-2 text-red-600">{formatINR(inst.lateFee)}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{formatINR(inst.emiAmount + (inst.lateFee || 0))}</td>
                        <td className="px-3 py-2"><StatusBadge status={inst.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminRepayments;
