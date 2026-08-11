import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { financingAPI, taxConfigAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminFinancing: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');

  
  const [processingFee, setProcessingFee] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const numApprovedAmount = Number(approvedAmount) || 0;
  const numInterestRate = Number(interestRate) || 0;
  const numProcessingFee = Number(processingFee) || 0;
  const calculatedInterest = numApprovedAmount * (numInterestRate / 100);
  const calculatedTotalRepayment = numApprovedAmount + calculatedInterest + numProcessingFee;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await financingAPI.getAll(params);
      setRequests(data.data.requests);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load financing requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchRequests();

  const fetchInterestRate = async () => {
    try {
      const { data } = await taxConfigAPI.getActive();

console.log("API Response:", data);

const configs = data.data || [];

console.log("Configs:", configs);

const interest = configs.find(
  (item: any) => item.taxName === "Platform Interest"
);

console.log("Interest Config:", interest);


if (interest) {
  console.log("Setting interest rate:", interest.taxPercentage);
  setInterestRate(String(interest.taxPercentage));
}
    } catch (error) {
      console.error(error);
    }
  };

  fetchInterestRate();
}, [page, statusFilter]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await financingAPI.approve(selectedRequest._id, {
        approvedAmount: Number(approvedAmount),
        interestRate: Number(interestRate),
        processingFee: Number(processingFee),
        remarks,
      });
      toast.success('Financing approved!');
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };
  console.log("Current interestRate:", interestRate);


  const handleReject = async () => {
    setProcessing(true);
    try {
      await financingAPI.reject(selectedRequest._id, { remarks });
      toast.success('Financing rejected');
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburse = async (id: string) => {
    try {
      await financingAPI.disburse(id);
      toast.success('Financing disbursed successfully');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disburse');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Financing Requests</h1>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="disbursed">Disbursed</option>
          <option value="repayment">Repayment</option>
          <option value="completed">Completed</option>
        </select>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{req.userId?.companyName || req.userId?.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.invoiceId?.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{req.requestedAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.interestRate > 0 ? `${req.interestRate}%` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.processingFee > 0 ? `₹${req.processingFee.toLocaleString('en-IN')}` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.tenureMonths}m</td>
                      <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
  <button
    onClick={() => {
      setSelectedRequest(req);
      setApprovedAmount(String(req.requestedAmount));
      setProcessingFee('');
      setRemarks('');
      setShowModal(true);
    }}
    className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
  >
    Review
  </button>

                          )}
                          {req.status === 'approved' && (
                            <button onClick={() => handleDisburse(req._id)} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                              Disburse
                            </button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Review Financing Request">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Business</span>
                <span className="text-sm font-medium">{selectedRequest.userId?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Invoice</span>
                <span className="text-sm font-medium">{selectedRequest.invoiceId?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested Amount</span>
                <span className="text-sm font-medium">₹{selectedRequest.requestedAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tenure</span>
                <span className="text-sm font-medium">{selectedRequest.tenureMonths} months</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount</label>
              <input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min="0" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Interest Rate (%)
  </label>

  <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700">
    {interestRate}%
  </div>

  <p className="text-xs text-gray-500 mt-1">
    Auto-loaded from Tax Management
  </p>
</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee</label>
                <input type="number" value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min="0" required />
              </div>
            </div>

            {numApprovedAmount > 0 && numInterestRate > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Interest Amount</span>
                  <span className="font-medium">₹{calculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-blue-100 pt-2">
                  <span className="font-semibold text-gray-900">Total Repayment</span>
                  <span className="font-bold text-gray-900">₹{calculatedTotalRepayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" rows={3} />
            </div>

            {selectedRequest.status === 'pending' ? (
              <div className="flex gap-3 pt-2">
                <button onClick={handleApprove} disabled={processing} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {processing ? 'Processing...' : 'Approve'}
                </button>
                <button onClick={handleReject} disabled={processing} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 font-medium py-2">
                This request has already been processed (Status: {selectedRequest.status})
              </p>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminFinancing;

