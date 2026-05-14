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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const completeLogin = async (credential) => {
    setIsSigningIn(true);
    setError('');
    const result = await handleGoogleLoginSuccess({ credential });
    if (result.success) {
      const storedRedirect = sessionStorage.getItem('googleLoginRedirect');
      sessionStorage.removeItem('googleLoginRedirect');
      navigate(storedRedirect || redirectTo);
    } else {
      setError(result.error || 'Login failed');
      setIsSigningIn(false);
    }
  };

  React.useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const idToken = hashParams.get('id_token');
    const state = hashParams.get('state');
    const expectedState = sessionStorage.getItem('googleLoginState');

    if (!idToken) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    if (expectedState && state !== expectedState) {
      setError('Google login verification failed. Please try again.');
      return;
    }

    sessionStorage.removeItem('googleLoginState');
    completeLogin(idToken);
  }, []);

  const startGoogleLogin = () => {
    if (!googleClientId) {
      setError('Google login is not configured.');
      return;
    }

    const state = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('googleLoginState', state);
    sessionStorage.setItem('googleLoginRedirect', redirectTo);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/login`);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', state);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');
    window.location.assign(authUrl.toString());
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">MongoDB Club</h1>
          <p className="text-gray-700 text-base sm:text-lg">Discover workshops and build expertise</p>
        </div>

        {/* Main Card */}
        <div className="login-auth-card rounded-2xl p-5 sm:p-10 mb-6">
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
              onClick={startGoogleLogin}
              disabled={isSigningIn}
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
