import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/UI';
import { BrandMark } from '../components/BrandMark';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const LoginPage = () => {
  const { handleGoogleLoginSuccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = React.useState('');
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const redirectTo = searchParams.get('redirect') || '/workshops';

  const handleSuccess = async (credentialResponse) => {
    setIsSigningIn(true);
    setError('');
    const result = await handleGoogleLoginSuccess(credentialResponse);
    if (result.success) {
      navigate(redirectTo);
    } else {
      setError(result.error || 'Login failed');
      setIsSigningIn(false);
    }
  };

  const handleError = () => {
    setError('Login failed. Please try again.');
    setIsSigningIn(false);
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link to="/" className="flex justify-center mb-6">
            <div className="rounded-2xl bg-white/80 border border-slate-200 px-3 py-3 sm:px-4 shadow-xl max-w-full overflow-hidden">
              <BrandMark />
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">MongoDB Club</h1>
          <p className="text-gray-700 text-lg">Discover workshops and build expertise</p>
        </div>

        {/* Main Card */}
        <div className="panel rounded-2xl p-8 sm:p-10 mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-700">Sign in to register for workshops and manage your events.</p>
          </div>

          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
            />
          )}

          <div className="mb-8">
            <GoogleAuthButton
              onSuccess={handleSuccess}
              onError={handleError}
              text="signin_with"
            />
            {isSigningIn && (
              <p className="mt-3 text-center text-sm font-semibold text-slate-700">
                Signing you in...
              </p>
            )}
          </div>

          <p className="text-center text-gray-700 text-sm mb-8">
            Sign in with your Google account to get started instantly.
          </p>

          <p className="text-center text-gray-600 text-xs">
            By signing in, you agree to our <span className="text-green-600 font-semibold">terms and conditions</span>
          </p>
        </div>
      </div>
    </div>
  );
};
