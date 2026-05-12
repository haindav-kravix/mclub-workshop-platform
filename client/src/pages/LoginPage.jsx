import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/UI';

export const LoginPage = () => {
  const { handleGoogleLoginSuccess } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');

  const handleSuccess = async (credentialResponse) => {
    const result = await handleGoogleLoginSuccess(credentialResponse);
    if (result.success) {
      navigate('/workshops');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleError = () => {
    setError('Login failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="panel rounded-lg overflow-hidden w-full max-w-4xl grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden md:flex bg-slate-950 text-white p-8 flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center font-bold mb-8">MC</div>
            <h1 className="text-4xl font-bold mb-4">Welcome back.</h1>
            <p className="text-slate-300">Sign in to register for workshops and keep track of your events.</p>
          </div>
          <p className="text-sm text-slate-400">MongoDB Club Workshop Hub</p>
        </div>

      <div className="bg-white p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-950 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">MC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MongoDB Club</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
          />
        )}

        <div className="mb-6">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            text="signin_with"
            size="large"
            width="100%"
          />
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          By signing in, you agree to our terms and conditions
        </p>
      </div>
      </div>
    </div>
  );
};
