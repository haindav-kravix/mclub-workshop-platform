import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationAPI, workshopAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../components/UI';
import { RegistrationsTable } from '../components/RegistrationsTable';
import { FiArrowLeft, FiCheckCircle, FiClock, FiDownload, FiSearch, FiUsers, FiXCircle } from 'react-icons/fi';

export const RegistrationsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalCount = registrations.length;
  const confirmedCount = registrations.filter(registration => registration.status === 'confirmed').length;
  const pendingCount = registrations.filter(registration => registration.status === 'pending').length;
  const rejectedCount = registrations.filter(registration => registration.status === 'rejected').length;
  const cancelledCount = registrations.filter(registration => registration.status === 'cancelled').length;
  const countCards = [
    { label: 'Total', value: totalCount, status: 'all', icon: FiUsers, className: 'border-slate-200 bg-white text-slate-950', activeClass: 'ring-slate-400', iconClass: 'bg-slate-100 text-slate-700' },
    { label: 'Confirmed', value: confirmedCount, status: 'confirmed', icon: FiCheckCircle, className: 'border-emerald-200 bg-emerald-50 text-emerald-900', activeClass: 'ring-emerald-500', iconClass: 'bg-emerald-100 text-emerald-700' },
    { label: 'Reviewing', value: pendingCount, status: 'pending', icon: FiClock, className: 'border-amber-200 bg-amber-50 text-amber-900', activeClass: 'ring-amber-500', iconClass: 'bg-amber-100 text-amber-700' },
    { label: 'Rejected', value: rejectedCount, status: 'rejected', icon: FiXCircle, className: 'border-rose-200 bg-rose-50 text-rose-900', activeClass: 'ring-rose-500', iconClass: 'bg-rose-100 text-rose-700' }
  ];
  const statusFilteredRegistrations = activeStatus === 'all'
    ? registrations
    : registrations.filter(registration => registration.status === activeStatus);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredRegistrations = normalizedSearch
    ? statusFilteredRegistrations.filter(registration => {
        const formValues = Object.values(registration.formData || {}).flat().join(' ');
        return [
          registration.userId?.name,
          registration.userId?.email,
          registration.status,
          formValues
        ].filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch);
      })
    : statusFilteredRegistrations;
  const activeCard = countCards.find(card => card.status === activeStatus) || countCards[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workshopRes, regsRes] = await Promise.all([
          workshopAPI.getAdminWorkshopById(workshopId),
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

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`registrations-scroll:${workshopId}`);
    if (!savedScroll || loading) return;
    const scrollY = Number(savedScroll);
    window.setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'auto' }), 80);
  }, [loading, workshopId]);

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
      <div className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> <span>Back to Dashboard</span>
          </button>
          {workshop && (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-secondary">Workshop registrations</p>
                <h1 className="mt-2 max-w-4xl break-words text-2xl font-black leading-tight text-slate-950 sm:text-4xl">{workshop.title}</h1>
              </div>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                {totalCount} total · {confirmedCount} confirmed · {rejectedCount} rejected
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {countCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeStatus === card.status;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => setActiveStatus(card.status)}
                className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${card.className} ${
                  isActive ? `ring-2 ${card.activeClass}` : ''
                }`}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-3xl font-black leading-none">{card.value}</p>
                    <p className="mt-1 truncate text-xs font-black uppercase tracking-wide sm:text-sm">{card.label}</p>
                    <p className="mt-1 text-[11px] font-bold opacity-70">
                      {isActive ? 'Showing now' : 'Click to view'}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${card.iconClass}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {cancelledCount > 0 && (
          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
            Cancelled registrations: <span className="font-black text-slate-950">{cancelledCount}</span>
          </div>
        )}

        {/* Export Button */}
        {registrations.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-600">
                Showing <span className="text-slate-950">{filteredRegistrations.length}</span> {activeCard.label.toLowerCase()} registration{filteredRegistrations.length === 1 ? '' : 's'}
              </p>
              {normalizedSearch && (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Search applied from {statusFilteredRegistrations.length} visible records
                </p>
              )}
            </div>
            <button
              onClick={handleExportToExcel}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-black text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
            >
              <FiDownload /> <span>Export to Excel</span>
            </button>
          </div>
        )}

        {registrations.length > 0 && (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-emerald-400 focus-within:bg-white">
              <FiSearch className="flex-none text-slate-500" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search registrations by name, email, status, or form answer"
                className="min-h-11 flex-1 border-0 bg-transparent p-0 text-sm font-bold outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-md bg-white px-2 py-1 text-xs font-black text-slate-500 transition hover:text-slate-950"
                >
                  Clear
                </button>
              )}
            </label>
          </div>
        )}

        {/* Registrations Table */}
        <RegistrationsTable
          registrations={filteredRegistrations}
          formFields={workshop?.registrationFormFields || []}
          onDeleteRegistration={handleDeleteRegistration}
          onUpdateRegistrationStatus={handleUpdateRegistrationStatus}
          onViewPaymentScreenshot={(registrationId, imageKey = 'paymentScreenshot') => {
            sessionStorage.setItem(`registrations-scroll:${workshopId}`, String(window.scrollY));
            navigate(`/admin/registrations/${workshopId}/image/${registrationId}/${imageKey}`);
          }}
          loading={deleting}
          emptyMessage={normalizedSearch ? 'No registrations match your search' : activeStatus === 'all' ? 'No registrations yet' : `No ${activeCard.label.toLowerCase()} registrations`}
        />
      </div>
    </div>
  );
};
