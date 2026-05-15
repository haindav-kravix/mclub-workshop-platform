import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationAPI, workshopAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../components/UI';
import { RegistrationsTable } from '../components/RegistrationsTable';
import { FiArrowLeft, FiCheckCircle, FiClock, FiDownload, FiUsers, FiXCircle } from 'react-icons/fi';

export const RegistrationsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalCount = registrations.length;
  const confirmedCount = registrations.filter(registration => registration.status === 'confirmed').length;
  const pendingCount = registrations.filter(registration => registration.status === 'pending').length;
  const rejectedCount = registrations.filter(registration => registration.status === 'rejected').length;
  const cancelledCount = registrations.filter(registration => registration.status === 'cancelled').length;
  const countCards = [
    { label: 'Total Registrations', value: totalCount, icon: FiUsers, className: 'border-slate-200 bg-white text-slate-950' },
    { label: 'Confirmed Students', value: confirmedCount, icon: FiCheckCircle, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    { label: 'Pending Review', value: pendingCount, icon: FiClock, className: 'border-amber-200 bg-amber-50 text-amber-800' },
    { label: 'Rejected', value: rejectedCount, icon: FiXCircle, className: 'border-rose-200 bg-rose-50 text-rose-800' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workshopRes, regsRes] = await Promise.all([
          workshopAPI.getWorkshopById(workshopId),
          registrationAPI.getWorkshopRegistrations(workshopId)
        ]);
        setWorkshop(workshopRes.data);
        setRegistrations(regsRes.data);
      } catch (err) {
        setError('Failed to load registrations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workshopId]);

  const handleDeleteRegistration = async (registrationId) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      setDeleting(true);
      try {
        await registrationAPI.deleteRegistration(registrationId, workshopId);
        setRegistrations(registrations.filter(r => r._id !== registrationId));
        setSuccess('Registration deleted successfully');
      } catch (err) {
        setError('Failed to delete registration');
        console.error(err);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId, status) => {
    setDeleting(true);
    setError('');
    try {
      const response = await registrationAPI.updateRegistrationStatus(registrationId, status);
      setRegistrations(prev => prev.map(registration =>
        registration._id === registrationId ? response.data.registration : registration
      ));
      setSuccess(status === 'confirmed' ? 'Registration approved' : 'Registration rejected');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update registration status');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await registrationAPI.exportRegistrations(workshopId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${workshop.title}-registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      setSuccess('Excel file downloaded successfully');
    } catch (err) {
      setError('Failed to export registrations');
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition font-medium mb-4"
          >
            <FiArrowLeft /> <span>Back to Dashboard</span>
          </button>
          {workshop && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{workshop.title}</h1>
              <p className="text-gray-600 mt-2">
                {totalCount} registrations, {confirmedCount} confirmed, {rejectedCount} rejected
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {countCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-lg border p-4 shadow-sm ${card.className}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black">{card.value}</p>
                    <p className="text-xs sm:text-sm font-bold">{card.label}</p>
                  </div>
                  <Icon size={22} className="flex-none" />
                </div>
              </div>
            );
          })}
        </div>

        {cancelledCount > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
            Cancelled registrations: <span className="font-black text-slate-950">{cancelledCount}</span>
          </div>
        )}

        {/* Export Button */}
        {registrations.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleExportToExcel}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
            >
              <FiDownload /> <span>Export to Excel</span>
            </button>
          </div>
        )}

        {/* Registrations Table */}
        <RegistrationsTable
          registrations={registrations}
          formFields={workshop?.registrationFormFields || []}
          onDeleteRegistration={handleDeleteRegistration}
          onUpdateRegistrationStatus={handleUpdateRegistrationStatus}
          loading={deleting}
        />
      </div>
    </div>
  );
};
