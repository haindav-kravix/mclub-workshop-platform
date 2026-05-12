import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiLogIn, FiRefreshCw } from 'react-icons/fi';

export const QRCheckInPage = () => {
  const { workshopId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const date = searchParams.get('date');
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadWorkshop = async () => {
      try {
        const response = await workshopAPI.getWorkshopById(workshopId);
        setWorkshop(response.data);
      } catch (err) {
        setError('Failed to load workshop');
      } finally {
        setLoading(false);
      }
    };
    loadWorkshop();
  }, [workshopId]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await attendanceAPI.qrCheckIn(workshopId, { date });
      setSuccess(`Thank you, ${response.data.user.name}. Your attendance is marked present.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const loginRedirect = `/attendance/check-in/${workshopId}?date=${date}`;

  const handleSwitchAccount = () => {
    logout();
    navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell flex items-center justify-center p-4">
      <div className="panel rounded-lg max-w-lg w-full p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-secondary flex items-center justify-center mx-auto mb-5">
          <FiCheck size={30} />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 mb-2">QR Attendance Check-in</p>
        <h1 className="text-3xl font-black text-slate-950">{workshop?.title}</h1>
        <p className="text-slate-600 mt-2">
          {date ? new Date(`${date}T00:00:00`).toLocaleDateString() : 'Attendance date missing'}
        </p>

        {error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
        {success ? (
          <div className="mt-6 rounded-lg bg-primary/20 border border-primary p-6">
            <h2 className="text-2xl font-black text-secondary">Thank you!</h2>
            <p className="text-secondary mt-2">{success}</p>
          </div>
        ) : null}

        <p className="text-sm text-slate-500 mt-4">
          Check-in works only while the admin has QR attendance turned on.
        </p>

        {!success && !isAuthenticated ? (
          <button
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`)}
              className="mt-6 w-full px-6 py-3 bg-secondary text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <FiLogIn /> Login with registered Google email
          </button>
        ) : !success ? (
          <>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Checking in as</p>
              <p className="font-bold text-slate-950">{user?.email}</p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={submitting || !date}
              className="mt-6 w-full px-6 py-3 bg-secondary text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Marking...' : 'Confirm Attendance'}
            </button>
            <button
              onClick={handleSwitchAccount}
              className="mt-3 w-full px-6 py-3 bg-slate-100 text-slate-800 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200"
            >
              <FiRefreshCw /> Use Different Google Account
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
