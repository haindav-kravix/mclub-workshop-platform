import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiUsers, FiDownload } from 'react-icons/fi';
import { ErrorMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] w-full max-w-5xl panel rounded-lg overflow-hidden">
        <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-10">
          <div>
            <div className="w-12 h-12 bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center font-bold mb-8">
              MC
            </div>
            <p className="text-cyan-300 uppercase tracking-wide text-sm font-bold mb-3">Admin command center</p>
            <h1 className="text-4xl font-bold leading-tight mb-4">Run every workshop from one shared dashboard.</h1>
            <p className="text-slate-300 text-lg">Create events, manage registrations, export clean spreadsheets, and collaborate with every admin.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: FiShield, label: 'Admin Access' },
              { icon: FiUsers, label: 'Shared Data' },
              { icon: FiDownload, label: 'Clean Export' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="border border-white/10 bg-white/10 rounded-lg p-4">
                  <Icon className="text-cyan-300 mb-3" />
                  <p className="text-sm font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-950 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
            <FiLock size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MC Admin</h1>
          <p className="text-gray-600 mt-2">Sign up or log in as an administrator</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              mode === 'login' ? 'bg-slate-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              mode === 'signup' ? 'bg-slate-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        <div className="mb-6">
          <GoogleLogin
            onSuccess={(credentialResponse) => completeAdminAuth({ credential: credentialResponse.credential })}
            onError={() => setError('Google authentication failed. Please try again.')}
            text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            size="large"
            width="100%"
          />
        </div>
        </div>
      </div>
    </div>
  );
};
