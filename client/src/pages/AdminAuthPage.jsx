import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiLock, FiShield, FiUsers, FiX } from 'react-icons/fi';
import { ErrorMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

const ADMIN_ACCESS_CODE = 'KLHAZ';

export const AdminAuthPage = () => {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleAdminAuth } = useAuth();
  const navigate = useNavigate();

  const openAccessPopup = (selectedMode) => {
    setMode(selectedMode);
    setAccessCode('');
    setAccessError('');
    setShowAccessPopup(true);
  };

  const verifyAccessCode = (event) => {
    event.preventDefault();
    const normalizedCode = accessCode.trim().toUpperCase();

    if (normalizedCode !== ADMIN_ACCESS_CODE) {
      setAccessError('Invalid access code. Please check and try again.');
      return;
    }

    setAccessError('');
    setAccessGranted(true);
    setShowAccessPopup(false);
  };

  const completeAdminAuth = async ({ credential, selectedMode = mode }) => {
    if (!accessGranted) {
      openAccessPopup(selectedMode);
      return;
    }

    setError('');
    setLoading(true);

    const result = await handleAdminAuth({
      credential,
      mode: selectedMode,
    });

    setLoading(false);

    if (result.success) {
      navigate('/admin');
      return;
    }

    setError(result.error || 'Admin authentication failed');
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-3 py-4 sm:p-4">
      <div className="w-full max-w-2xl">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-10">
          <Link to="/" className="flex justify-center mb-6">
            <div className="rounded-2xl bg-white/80 border border-slate-200 px-3 py-3 sm:px-4 shadow-xl max-w-full overflow-hidden">
              <BrandMark />
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">MC Admin</h1>
          <p className="text-gray-700 text-base sm:text-lg">Manage workshops and community at scale</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="panel rounded-xl p-4 text-center">
            <FiShield className="text-3xl text-green-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Secure Access</p>
          </div>
          <div className="panel rounded-xl p-4 text-center">
            <FiUsers className="text-3xl text-green-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Manage Users</p>
          </div>
          <div className="panel rounded-xl p-4 text-center">
            <FiDownload className="text-3xl text-green-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Export Data</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="login-auth-card rounded-2xl p-5 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
            <p className="text-gray-700">Sign in or create an admin account</p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => openAccessPopup('login')}
              className={`px-6 py-3 rounded-lg font-bold transition transform ${
                mode === 'login' 
                  ? 'bg-green-600 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => openAccessPopup('signup')}
              className={`px-6 py-3 rounded-lg font-bold transition transform ${
                mode === 'signup' 
                  ? 'bg-green-600 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

          <div className="mb-8">
            {accessGranted ? (
              <>
                <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  <FiCheckCircle />
                  Access code verified
                </div>
                <GoogleAuthButton
                  onSuccess={(credentialResponse) => completeAdminAuth({ credential: credentialResponse.credential })}
                  onError={() => setError('Google authentication failed. Please try again.')}
                  text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                />
                {loading && (
                  <p className="mt-3 text-center text-sm font-semibold text-slate-700">
                    Signing you in...
                  </p>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAccessPopup(mode)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-black text-white transition hover:bg-primary/90"
              >
                <FiLock /> Enter Access Code
              </button>
            )}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-600">Admin Only</span>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-bold">⚠️ Notice:</span> Only authorized administrators can access this panel. Use your authorized Google account.
            </p>
          </div>
        </div>
      </div>

      {showAccessPopup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <FiLock size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-950">Admin Access Code</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter the access code to continue with admin {mode === 'signup' ? 'sign up' : 'login'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAccessPopup(false)}
                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                aria-label="Close access code popup"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={verifyAccessCode} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Access Code</label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  className="w-full px-4 py-3 text-center text-lg font-black uppercase tracking-[0.2em] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="•••••"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {accessError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {accessError}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-3 font-black text-white transition hover:bg-primary/90"
              >
                Verify Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
