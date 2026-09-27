import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { adminAccountAPI } from '../utils/api';

export const AdminAccountsPage = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    adminAccountAPI.getAll()
      .then(response => setAdmins(response.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load admin accounts'))
      .finally(() => setLoading(false));
  }, []);

  const revokeAdmin = async (admin) => {
    if (!window.confirm(`Revoke admin access for ${admin.name}? They will continue as a regular user.`)) return;
    setRevoking(admin._id);
    setError('');
    try {
      const response = await adminAccountAPI.revoke(admin._id);
      setAdmins(previous => previous.filter(item => item._id !== admin._id));
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to revoke admin access');
    } finally {
      setRevoking('');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <button onClick={() => navigate('/admin')} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-secondary shadow-sm hover:bg-emerald-50">
          <FiArrowLeft /> Back to Admin
        </button>
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-300"><FiShield /> Access control</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Admin Accounts</h1>
          <p className="mt-3 max-w-2xl font-semibold text-slate-300">Review active administrators and return an account to regular user access.</p>
        </section>
        <div className="mt-6">{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}{success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}</div>
        <div className="mt-6 grid gap-3">
          {admins.map(admin => (
            <div key={admin._id} className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-4">
                <ProfileAvatar user={admin} className="h-12 w-12 rounded-full object-cover" fallbackClassName="h-12 w-12 rounded-full bg-secondary text-white" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-950">{admin.name}</p>
                  <p className="truncate text-sm font-semibold text-slate-500">{admin.email}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-700"><FiUserCheck /> {admin.isCurrentUser ? 'Current account' : 'Active admin'}</p>
                </div>
              </div>
              <button
                onClick={() => revokeAdmin(admin)}
                disabled={admin.isCurrentUser || Boolean(revoking)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-black text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiUserX /> {revoking === admin._id ? 'Revoking...' : admin.isCurrentUser ? 'Current Admin' : 'Revoke Admin'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
