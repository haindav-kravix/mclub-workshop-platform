import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiLogIn } from 'react-icons/fi';

export const QRCheckInPage = () => {
  const { workshopId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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
      setSuccess(`${response.data.user.name}, your attendance is marked present.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell flex items-center justify-center p-4">
      <div className="panel rounded-lg max-w-lg w-full p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
          <FiCheck size={30} />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 mb-2">QR Attendance Check-in</p>
        <h1 className="text-3xl font-black text-slate-950">{workshop?.title}</h1>
        <p className="text-slate-600 mt-2">
          {date ? new Date(`${date}T00:00:00`).toLocaleDateString() : 'Attendance date missing'}
        </p>

        {error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
        {success && <div className="mt-5"><SuccessMessage message={success} onDismiss={() => setSuccess('')} /></div>}

        {!isAuthenticated ? (
          <button
            onClick={() => navigate(`/login?redirect=/attendance/check-in/${workshopId}?date=${date}`)}
            className="mt-6 w-full px-6 py-3 bg-slate-950 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <FiLogIn /> Login with registered Google email
          </button>
        ) : (
          <>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Checking in as</p>
              <p className="font-bold text-slate-950">{user?.email}</p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={submitting || !date || success}
              className="mt-6 w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Marking...' : success ? 'Attendance Marked' : 'Confirm Attendance'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
