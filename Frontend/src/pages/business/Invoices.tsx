import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { invoiceAPI, taxConfigAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineTrash, HiOutlinePaperAirplane } from 'react-icons/hi';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTax, setActiveTax] = useState<{ taxName: string; taxPercentage: number }>({ taxName: 'No Tax', taxPercentage: 0 });
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerCompany: '',
    invoiceAmount: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'INR',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const invoiceAmount = Number(formData.invoiceAmount) || 0;
  const taxAmount = (invoiceAmount * activeTax.taxPercentage) / 100;
  const totalAmount = invoiceAmount + taxAmount;

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await invoiceAPI.getMy(params);
      setInvoices(data.data.invoices);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter]);

  useEffect(() => {
    const fetchActiveTax = async () => {
      try {
        const { data } = await taxConfigAPI.getActive();
        if (data.data?.taxPercentage > 0) {
          setActiveTax(data.data);
        }
      } catch (e) {
        // No active tax config is fine
      }
    };
    fetchActiveTax();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchInvoices();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => fd.append(key, value));
      fd.append('taxPercentage', String(activeTax.taxPercentage));
      if (invoiceFile) fd.append('invoiceFile', invoiceFile);
      await invoiceAPI.create(fd);
      toast.success('Invoice created!');
      setShowCreateModal(false);
      setFormData({ buyerName: '', buyerCompany: '', invoiceAmount: '', invoiceDate: '', dueDate: '', currency: 'INR' });
      setInvoiceFile(null);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleSubmitForVerification = async (id: string) => {
    setSubmittingId(id);
    try {
      await invoiceAPI.submit(id);
      toast.success('Invoice submitted for verification');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Invoice
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_verification">Under Verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="requires_correction">Requires Correction</option>
            <option value="financed">Financed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            message="Create your first invoice to get started"
            action={
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Create Invoice
              </button>
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.buyerCompany}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {inv.invoiceFile && (
                            <a href={`http://localhost:5000${inv.invoiceFile}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                              PDF
                            </a>
                          )}
                          {(inv.status === 'draft' || inv.status === 'rejected' || inv.status === 'requires_correction') && (
                            <>
                              <button onClick={() => handleSubmitForVerification(inv._id)} disabled={submittingId === inv._id} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-40 disabled:cursor-not-allowed" title="Submit">
                                <HiOutlinePaperAirplane className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(inv._id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                <HiOutlineTrash className="w-4 h-4" />
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
              <input type="text" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Company</label>
              <input type="text" value={formData.buyerCompany} onChange={(e) => setFormData({ ...formData, buyerCompany: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Amount (₹)</label>
            <input type="number" value={formData.invoiceAmount} onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required min="1" />
          </div>

          {activeTax.taxPercentage > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({activeTax.taxName} @ {activeTax.taxPercentage}%)</span>
                <span className="font-medium">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="font-medium text-gray-900">Total Amount</span>
                <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            <p className="text-xs text-gray-500 mt-1">An invoice PDF will be auto-generated. You can optionally attach a supporting document.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Invoices;
