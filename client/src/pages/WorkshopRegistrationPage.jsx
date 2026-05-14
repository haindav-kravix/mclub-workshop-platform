import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { registrationAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { RegistrationForm } from '../components/RegistrationForm';
import { useAuth } from '../context/AuthContext';

export const WorkshopRegistrationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [workshopResponse, registrationsResponse] = await Promise.all([
          workshopAPI.getWorkshopById(id),
          isAuthenticated ? registrationAPI.getUserRegistrations() : Promise.resolve({ data: [] })
        ]);
        setWorkshop(workshopResponse.data);
        const existing = registrationsResponse.data.find(registration => {
          const registeredWorkshopId = registration.workshopId?._id || registration.workshopId;
          return registeredWorkshopId === id;
        });
        setRegistrationStatus(existing?.status || '');
      } catch (err) {
        setError('Failed to load registration form');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isAuthenticated]);

  const handleRegistration = async (formData) => {
    try {
      await registrationAPI.registerForWorkshop({ workshopId: id, formData });
      setRegistrationStatus('pending');
      setSuccess('Registration submitted. Your registration is under review. Check My Events for your latest status.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    navigate(`/login?redirect=${encodeURIComponent(`/workshop/${id}/register`)}`);
    return null;
  }

  const registrationsOpen = workshop?.registrationsOpen !== false && !workshop?.isStopped;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <button onClick={() => navigate(`/workshop/${id}`)} className="mb-5 flex items-center gap-2 font-semibold text-primary">
          <FiArrowLeft /> Back to Workshop
        </button>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        {!workshop ? (
          <div className="panel rounded-lg p-10 text-center font-semibold text-slate-700">Workshop not found</div>
        ) : registrationStatus === 'confirmed' ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-black text-emerald-800">Registration confirmed</h1>
            <p className="mt-2 text-slate-600">You are already approved for this workshop.</p>
          </div>
        ) : registrationStatus === 'pending' ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-black text-amber-800">Reviewing your registration</h1>
            <p className="mt-2 text-slate-600">Admin approval is pending. Check My Events for your latest status.</p>
          </div>
        ) : registrationStatus === 'rejected' ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-black text-rose-700">Registration rejected</h1>
            <p className="mt-2 text-slate-600">Contact support if you need help with this registration.</p>
          </div>
        ) : !registrationsOpen ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-black text-amber-800">Registrations closed</h1>
            <p className="mt-2 text-slate-600">This workshop is not accepting new registrations right now.</p>
          </div>
        ) : (
          <RegistrationForm
            workshop={workshop}
            onSubmit={handleRegistration}
            variant="page"
          />
        )}
      </div>
    </div>
  );
};
