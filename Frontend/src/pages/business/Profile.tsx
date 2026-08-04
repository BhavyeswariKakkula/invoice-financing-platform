import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { businessProfileAPI } from '../../api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/StatusBadge';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    businessCategory: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await businessProfileAPI.getProfile();
      setProfile(data.data);
      setFormData({
        companyName: data.data.companyName || '',
        registrationNumber: data.data.registrationNumber || '',
        gstNumber: data.data.gstNumber || '',
        panNumber: data.data.panNumber || '',
        contactPerson: data.data.contactPerson || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
        address: data.data.address || '',
        businessCategory: data.data.businessCategory || '',
        bankName: data.data.bankDetails?.bankName || '',
        accountNumber: data.data.bankDetails?.accountNumber || '',
        ifscCode: data.data.bankDetails?.ifscCode || '',
        branch: data.data.bankDetails?.branch || '',
      });
    } catch (error: any) {
  if (error.response?.status === 404) {
    // Profile doesn't exist yet
    setProfile(null);
    setEditing(true);
  } else {
    toast.error("Failed to load profile");
  }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const handleFocus = () => fetchProfile();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branch: formData.branch,
        },
      };
      if (profile) {
        await businessProfileAPI.updateProfile(payload);
      } else {
        await businessProfileAPI.createProfile(payload);
      }
      toast.success('Profile saved!');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
          {profile && !editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Edit Profile
            </button>
          )}
        </div>

        {profile && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">Verification Status:</span>
              <StatusBadge status={profile.verificationStatus === 'verified' ? 'verified' : profile.verificationStatus === 'rejected' ? 'rejected' : 'pending'} />
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Company Name', key: 'companyName' },
              { label: 'Registration Number', key: 'registrationNumber' },
              { label: 'GST Number', key: 'gstNumber' },
              { label: 'PAN Number', key: 'panNumber' },
              { label: 'Contact Person', key: 'contactPerson' },
              { label: 'Email', key: 'email' },
              { label: 'Phone', key: 'phone' },
              { label: 'Business Category', key: 'businessCategory' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={profile && !editing}
                  required
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                rows={2}
                disabled={profile && !editing}
                required
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Bank Name', key: 'bankName' },
              { label: 'Account Number', key: 'accountNumber' },
              { label: 'IFSC Code', key: 'ifscCode' },
              { label: 'Branch', key: 'branch' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={profile && !editing}
                  required
                />
              </div>
            ))}
          </div>

          {editing && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setEditing(false); fetchProfile(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
