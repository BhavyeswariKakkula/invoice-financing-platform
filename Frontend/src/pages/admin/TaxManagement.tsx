import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { taxConfigAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const TaxManagement: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ taxName: '', taxPercentage: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data } = await taxConfigAPI.getAll();
      setConfigs(data.data);
    } catch (error: any) {
      toast.error('Failed to load tax configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({ taxName: '', taxPercentage: '' });
    setShowModal(true);
  };

  const openEdit = (config: any) => {
    setEditing(config);
    setFormData({ taxName: config.taxName, taxPercentage: String(config.taxPercentage) });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        taxName: formData.taxName,
        taxPercentage: Number(formData.taxPercentage),
      };

      if (editing) {
        await taxConfigAPI.update(editing._id, payload);
        toast.success('Tax configuration updated');
      } else {
        await taxConfigAPI.create(payload);
        toast.success('Tax configuration created');
      }

      setShowModal(false);
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const { data } = await taxConfigAPI.toggle(id);
      toast.success(data.message || 'Toggled successfully');
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax configuration?')) return;
    try {
      await taxConfigAPI.delete(id);
      toast.success('Tax configuration deleted');
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black-600 text-4xl">
  Interest Rate
</h1>
          
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : configs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No tax configurations yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a tax configuration to apply to invoices</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"> Interest Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {configs.map((config) => (
                    <tr key={config._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900"> Platform Interest</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{config.taxPercentage}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {config.isActive ? <HiOutlineCheck className="w-3 h-3" /> : <HiOutlineX className="w-3 h-3" />}
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span> 
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Tax Configuration' : 'Add Tax Configuration'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
            <input
              type="text"
              value={formData.taxName}
              onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. GST"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Percentage (%)</label>
            <input
              type="number"
              value={formData.taxPercentage}
              onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. 18"
              required
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default TaxManagement;
