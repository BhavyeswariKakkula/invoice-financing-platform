import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { adminAPI, businessProfileAPI } from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEye } from 'react-icons/hi';

const Businesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileRemarks, setProfileRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await adminAPI.getBusinesses(params);

      const profileRes = await businessProfileAPI.getAllProfiles({ limit: 1000 });
      const profiles = profileRes.data.data.profiles || [];
      const profileMap: Record<string, any> = {};
      profiles.forEach((p: any) => {
        const uid = p.userId?._id || p.userId;
        profileMap[uid] = p;
      });

      const merged = (data.data.users || []).map((u: any) => ({
        ...u,
        profile: profileMap[u._id] || null,
        _verificationStatus: profileMap[u._id]?.verificationStatus || 'pending',
        _verificationRemarks: profileMap[u._id]?.verificationRemarks || '',
      }));

      setBusinesses(merged);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [page]);

  const handleVerifyProfile = async (id: string, status: 'verified' | 'rejected') => {
    setProcessing(true);
    try {
      await businessProfileAPI.verifyProfile(id, { status, remarks: profileRemarks });
      toast.success(`Profile ${status} successfully`);
      setShowProfileModal(false);
      setSelectedProfile(null);
      setProfileRemarks('');
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('Business deleted');
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>

        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBusinesses()}
            placeholder="Search businesses..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button onClick={fetchBusinesses} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Search</button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {businesses.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.companyName || b.profile?.companyName || '-'}</td>
                      <td className="px-6 py-4">
                        {statusBadge(b._verificationStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedProfile(b.profile); setProfileRemarks(b._verificationRemarks); setShowProfileModal(true); }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View / Verify Profile"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(b._id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <HiOutlineXCircle className="w-5 h-5" />
                          </button>
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

      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Business Profile">
        {selectedProfile ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Company</span>
                <span className="text-sm font-medium">{selectedProfile.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Contact</span>
                <span className="text-sm font-medium">{selectedProfile.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">GST</span>
                <span className="text-sm font-medium">{selectedProfile.gstNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <StatusBadge status={selectedProfile.verificationStatus} />
              </div>
              {selectedProfile.verificationRemarks && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Remarks</span>
                  <span className="text-sm font-medium text-gray-700">{selectedProfile.verificationRemarks}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Remarks</label>
              <textarea
                value={profileRemarks}
                onChange={(e) => setProfileRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
                placeholder="Add remarks for approval or rejection..."
              />
            </div>

            {selectedProfile.verificationStatus === 'verified' ? (
              <p className="text-center text-sm text-green-600 font-medium py-2">This business is already verified</p>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleVerifyProfile(selectedProfile._id, 'verified')}
                  disabled={processing}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleVerifyProfile(selectedProfile._id, 'rejected')}
                  disabled={processing}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <HiOutlineXCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No Profile Submitted</p>
            <p className="text-sm mt-1">This business user has not yet submitted their company profile.</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Businesses;
