import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { repaymentAPI } from '../../api';
import toast from 'react-hot-toast';

type PaymentType = 'emi' | 'prepay' | 'close';

const Repayments: React.FC = () => {
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('emi');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionId: '',
    remarks: '',
  });
  const [prepayInstallments, setPrepayInstallments] = useState(1);
  const [remainingCount, setRemainingCount] = useState(0);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchRepayments = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await repaymentAPI.getMy(params);
      setRepayments(data.data.repayments);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load repayments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await repaymentAPI.getStats();
      setStats(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await repaymentAPI.getSummary();
      setSummary(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRepayments();
    fetchStats();
    fetchSummary();
  }, [page, statusFilter]);

  const openPayModal = (repayment: any, type: PaymentType) => {
    setSelectedRepayment(repayment);
    setPaymentType(type);
    setPaymentData({ amount: '', paymentMethod: 'bank_transfer', transactionId: '', remarks: '' });
    setPaymentProof(null);
    setPrepayInstallments(1);
    setShowPayModal(true);
  };

  const computeExpected = async (type: PaymentType) => {
    if (!selectedRepayment) return;
    try {
      if (type === 'close') {
        const { data } = await repaymentAPI.getQuote(selectedRepayment._id);
        setPaymentData((d) => ({ ...d, amount: String(data.data.totalPayoff) }));
      } else if (type === 'prepay') {
        const { data } = await repaymentAPI.getSchedule(selectedRepayment._id, { limit: 100 });
        const remaining = data.data.installments.filter((i: any) => i.status === 'pending' || i.status === 'overdue');
        setRemainingCount(remaining.length);
        const k = Math.min(prepayInstallments, remaining.length);
        const amount = remaining.slice(0, k).reduce((acc: number, i: any) => acc + i.emiAmount + (i.lateFee || 0), 0);
        setPaymentData((d) => ({ ...d, amount: String(Math.round(amount * 100) / 100) }));
      } else {
        const { data } = await repaymentAPI.getSchedule(selectedRepayment._id, { limit: 100 });
        const remaining = data.data.installments.filter((i: any) => i.status === 'pending' || i.status === 'overdue');
        setRemainingCount(remaining.length);
        const amount = remaining[0] ? remaining[0].emiAmount + (remaining[0].lateFee || 0) : 0;
        setPaymentData((d) => ({ ...d, amount: String(amount) }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not compute payment amount');
    }
  };

  useEffect(() => {
    if (showPayModal && selectedRepayment) {
      computeExpected(paymentType);
    }
  }, [showPayModal, paymentType, prepayInstallments, selectedRepayment]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    try {
      const formData = new FormData();
      formData.append('repaymentId', selectedRepayment._id);
      formData.append('amount', String(Number(paymentData.amount)));
      formData.append('paymentType', paymentType);
      if (paymentType === 'prepay') {
        formData.append('prepayInstallments', String(prepayInstallments));
      }
      formData.append('paymentMethod', paymentData.paymentMethod);
      formData.append('transactionId', paymentData.transactionId);
      formData.append('remarks', paymentData.remarks);
      if (paymentProof) {
        formData.append('paymentProof', paymentProof);
      }

      await repaymentAPI.submitPayment(formData);
      toast.success('Payment submitted for verification!');
      setShowPayModal(false);
      setSelectedRepayment(null);
      fetchRepayments();
      fetchStats();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment submission failed');
    } finally {
      setPaying(false);
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

  const canPay = (r: any) => ['active', 'overdue'].includes(r.status);
  const hasPending = (r: any) => (r.submittedAmount || 0) > 0;

  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Loan Repayments</h1>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Loan Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatINR(summary.loanAmount)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Outstanding Principal</p>
              <p className="text-xl font-bold text-red-600">{formatINR(summary.outstandingPrincipal)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Interest Remaining</p>
              <p className="text-xl font-bold text-orange-600">{formatINR(summary.interestRemaining)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatINR(summary.amountPaid)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">EMIs Paid</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.emisPaid || 0}<span className="text-sm text-gray-500"> / {summary.totalInstallments || 0}</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">EMIs Remaining</p>
              <p className="text-xl font-bold text-blue-600">{summary.emisRemaining || 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Current EMI</p>
              <p className="text-xl font-bold text-gray-900">{formatINR(summary.currentEmi)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Next Due Date</p>
              <p className="text-xl font-bold text-yellow-600">
                {summary.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          </div>
        )}

        {typeof summary?.loanProgressPercent === 'number' && (
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Loan Progress</p>
              <p className="text-sm font-semibold text-gray-900">{summary.loanProgressPercent.toFixed(1)}%</p>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, summary.loanProgressPercent)}%` }} />
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Active Loans</p>
              <p className="text-xl font-bold text-blue-600">{stats.active || 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Overdue Loans</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue || 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completed || 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Prepaid</p>
              <p className="text-xl font-bold text-purple-600">{stats.prepaid || 0}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="prepaid">Prepaid</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : repayments.length === 0 ? (
          <EmptyState title="No loans" message="Your loan repayment records will appear here once your financing is disbursed" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repayments.map((r) => (
              <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Invoice #{r.invoiceId?.invoiceNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      {r.status === 'completed' || r.status === 'prepaid'
                        ? `Closed on ${r.closedAt ? new Date(r.closedAt).toLocaleDateString('en-IN') : new Date(r.dueDate).toLocaleDateString('en-IN')}`
                        : `Next due ${r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString('en-IN') : new Date(r.dueDate).toLocaleDateString('en-IN')}`}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Loan Amount</p>
                    <p className="text-sm font-semibold text-gray-900">{formatINR(r.disbursedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Outstanding Principal</p>
                    <p className="text-sm font-semibold text-red-600">{formatINR(r.outstandingPrincipal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">EMI</p>
                    <p className="text-sm font-semibold text-gray-900">{formatINR(r.emiAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Remaining</p>
                    <p className="text-sm font-semibold text-orange-600">{formatINR(r.outstandingInterest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">EMIs Paid</p>
                    <p className="text-sm font-semibold text-green-600">{r.emisPaid || 0} / {r.totalInstallments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Collected</p>
                    <p className="text-sm font-semibold text-gray-900">{formatINR(r.interestCollected)}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${r.totalInstallments ? Math.min(100, ((r.emisPaid || 0) / r.totalInstallments) * 100) : 0}%` }}
                  />
                </div>
                {hasPending(r) && (
                  <p className="text-xs text-yellow-600">
                    Submitted {formatINR(r.submittedAmount)} ({r.submittedPaymentType === 'close' ? 'full closure' : r.submittedPaymentType === 'prepay' ? `${r.submittedInstallmentCount} EMIs prepaid` : 'current EMI'}) — awaiting admin verification
                  </p>
                )}
                {canPay(r) && (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => viewSchedule(r)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      Schedule
                    </button>
                    <button onClick={() => openPayModal(r, 'emi')} className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                      Pay EMI
                    </button>
                    <button onClick={() => openPayModal(r, 'close')} className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                      Close Loan
                    </button>
                  </div>
                )}
                {['completed', 'prepaid'].includes(r.status) && (
                  <div className="flex justify-end">
                    <button onClick={() => viewSchedule(r)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      Schedule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && repayments.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Make Payment">
        {selectedRepayment && (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-600">Invoice #{selectedRepayment.invoiceId?.invoiceNumber || 'N/A'}</p>
              <p className="text-sm text-gray-600">Loan Amount: {formatINR(selectedRepayment.disbursedAmount)}</p>
              <p className="text-sm text-gray-600">Outstanding Principal: {formatINR(selectedRepayment.outstandingPrincipal)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => { setPaymentType(e.target.value as PaymentType); setPrepayInstallments(1); }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="emi">Pay Current EMI</option>
                <option value="prepay">Prepay EMIs</option>
                <option value="close">Close Loan (Full Settlement)</option>
              </select>
            </div>

            {paymentType === 'prepay' && remainingCount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of EMIs to prepay</label>
                <input
                  type="number"
                  min={1}
                  max={remainingCount}
                  value={prepayInstallments}
                  onChange={(e) => setPrepayInstallments(Math.max(1, Math.min(remainingCount, Number(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">{remainingCount} EMI(s) remaining</p>
              </div>
            )}

            {paymentType === 'close' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Closing early charges accrued interest only; future interest is discounted. Pay the exact amount shown.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
  type="number"
  value={paymentData.amount}
  onChange={(e) =>
    setPaymentData({ ...paymentData, amount: e.target.value })
  }
  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
  required
  min="0"
  step="any"
  readOnly={paymentType === "close"}
/>
              {paymentType !== 'close' && (
                <p className="text-xs text-gray-500 mt-1">Amount must match the computed EMI exactly.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={paymentData.paymentMethod} onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
              <input type="text" value={paymentData.transactionId} onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof (Optional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea value={paymentData.remarks} onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={paying} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {paying ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="EMI Schedule">
        {selectedRepayment && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Invoice #{selectedRepayment.invoiceId?.invoiceNumber || 'N/A'} · {selectedRepayment.totalInstallments} EMIs of {formatINR(selectedRepayment.emiAmount)}
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

export default Repayments;
