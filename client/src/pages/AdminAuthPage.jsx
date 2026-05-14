import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiUsers, FiDownload } from 'react-icons/fi';
import { ErrorMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const AdminAuthPage = () => {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleAdminAuth } = useAuth();
  const navigate = useNavigate();

  const completeAdminAuth = async ({ credential, selectedMode = mode }) => {
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

  React.useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const idToken = hashParams.get('id_token');
    const state = hashParams.get('state');
    const expectedState = sessionStorage.getItem('googleAdminLoginState');
    const selectedMode = sessionStorage.getItem('googleAdminLoginMode') || mode;

    if (!idToken) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    if (expectedState && state !== expectedState) {
      setError('Google login verification failed. Please try again.');
      return;
    }

    sessionStorage.removeItem('googleAdminLoginState');
    sessionStorage.removeItem('googleAdminLoginMode');
    completeAdminAuth({ credential: idToken, selectedMode });
  }, []);

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
              onClick={() => setMode('login')}
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
              onClick={() => setMode('signup')}
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
    </div>
  );
};
