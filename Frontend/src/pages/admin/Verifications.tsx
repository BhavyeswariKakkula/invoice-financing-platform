import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { invoiceAPI, verificationAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const Verifications: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [checks, setChecks] = useState({
    duplicateCheck: true,
    mandatoryDocuments: true,
    invoiceValidity: true,
    buyerInformation: true,
    amountValidation: true,
  });
  const [processing, setProcessing] = useState(false);

  const fetchPendingInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.getAll({ page, limit: 10, status: 'submitted' });
      setInvoices(data.data.invoices.filter((inv: any) => inv.status === 'submitted'));
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, [page]);

  const handleVerify = async (result: 'approved' | 'rejected' | 'requires_correction') => {
    setProcessing(true);
    try {
      await verificationAPI.verify(selectedInvoice._id, { result, remarks, checks });
      toast.success(`Invoice ${result}`);
      setShowModal(false);
      setSelectedInvoice(null);
      setRemarks('');
      fetchPendingInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Verification</h1>

        {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <HiOutlineCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No invoices pending verification</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.userId?.companyName || inv.userId?.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.buyerCompany}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.submittedAt ? new Date(inv.submittedAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setSelectedInvoice(inv); setShowModal(true); }} className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
                          Review
                        </button>
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

     <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Verify Invoice">
  {selectedInvoice && (() => {
    const pdfUrl = `http://localhost:5000${
      selectedInvoice.invoiceFile.startsWith("/")
        ? selectedInvoice.invoiceFile
        : `/${selectedInvoice.invoiceFile}`
    }`;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Invoice Number</span>
            <span className="text-sm font-medium">
              {selectedInvoice.invoiceNumber}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Buyer</span>
            <span className="text-sm font-medium">
              {selectedInvoice.buyerCompany}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm text-gray-500">Invoice PDF</span>

            {selectedInvoice.invoiceFile ? (
              <>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View PDF
                </a>

                <iframe
                  src={pdfUrl}
                  title="Invoice PDF Preview"
                  width="100%"
                  height="500"
                  className="border rounded-lg"
                />
              </>
            ) : (
              <span className="text-red-500 text-sm">
                No PDF uploaded
              </span>
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="text-sm font-medium">
              ₹{selectedInvoice.totalAmount?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Checks
          </label>

          {Object.entries({
            duplicateCheck: "Duplicate Check",
            mandatoryDocuments: "Mandatory Documents",
            invoiceValidity: "Invoice Validity",
            buyerInformation: "Buyer Information",
            amountValidation: "Amount Validation",
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={(checks as any)[key]}
                onChange={(e) =>
                  setChecks({
                    ...checks,
                    [key]: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add verification remarks..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {selectedInvoice.status === 'submitted' ? (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleVerify("approved")}
              disabled={processing}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
              Approve
            </button>

            <button
              onClick={() => handleVerify("requires_correction")}
              disabled={processing}
              className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Needs Correction
            </button>

            <button
              onClick={() => handleVerify("rejected")}
              disabled={processing}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <HiOutlineXCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 font-medium py-2">
            This invoice has already been processed (Status: {selectedInvoice.status})
          </p>
        )}
      </div>
    );
  })()}
</Modal>
    </Layout>
  );
};

export default Verifications;
