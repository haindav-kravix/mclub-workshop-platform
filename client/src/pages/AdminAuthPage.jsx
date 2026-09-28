import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiUsers } from 'react-icons/fi';
import { ErrorMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const AdminAuthPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleAdminAuth } = useAuth();
  const navigate = useNavigate();

  const completeAdminAuth = async (credential) => {
    setError('');
    setLoading(true);
    const result = await handleAdminAuth({ credential, mode: 'login' });
    setLoading(false);

    if (result.success) {
      navigate('/admin');
      return;
    }
    setError(result.error || 'This Google account is not authorized for admin access.');
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-3 py-6 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-7 text-center sm:mb-10">
          <Link to="/" className="mb-6 flex justify-center">
            <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white/80 px-3 py-3 shadow-xl sm:px-4">
              <BrandMark />
            </div>
          </Link>
          <h1 className="mb-2 text-3xl font-black text-gray-900 sm:text-4xl">MC Admin</h1>
          <p className="text-base text-gray-700 sm:text-lg">Authorized club management</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="panel rounded-lg p-4 text-center">
            <FiShield className="mx-auto mb-3 text-3xl text-green-600" />
            <p className="text-sm font-semibold text-gray-900">Verified accounts only</p>
          </div>
          <div className="panel rounded-lg p-4 text-center">
            <FiUsers className="mx-auto mb-3 text-3xl text-green-600" />
            <p className="text-sm font-semibold text-gray-900">Server-enforced roles</p>
          </div>
        </div>

        <div className="login-auth-card rounded-xl p-5 sm:p-10">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FiLock size={23} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Admin sign in</h2>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                Continue with an existing administrator account. New admin access cannot be created from this page.
              </p>
            </div>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

          <GoogleAuthButton
            onSuccess={(response) => completeAdminAuth(response.credential)}
            onError={() => setError('Google authentication failed. Please try again.')}
            text="signin_with"
          />

          {loading && (
            <p className="mt-4 text-center text-sm font-semibold text-slate-700">Verifying administrator access...</p>
          )}

          <div className="mt-7 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm leading-6 text-emerald-950">
              Access is checked against the current admin list on every protected request. Revoked accounts are blocked immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
