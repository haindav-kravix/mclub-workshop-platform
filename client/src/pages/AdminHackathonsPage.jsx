import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiBarChart2, FiPlus, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { AdminWorkshopCard } from '../components/AdminWorkshopCard';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI, workshopAPI } from '../utils/api';
import { getEventLabel } from '../utils/eventLabels';

export const AdminHackathonsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const response = await workshopAPI.getAdminWorkshops({ eventType: 'hackathon' });
      setEvents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const updateEventInState = (updatedEvent) => {
    setEvents(prev => prev.map(event => event._id === updatedEvent._id ? updatedEvent : event));
  };

  const deleteEvent = async (eventId) => {
    const event = events.find(item => item._id === eventId);
    if (!window.confirm(`Delete ${event?.title || 'this hackathon'}? This cannot be undone.`)) return;

    try {
      await workshopAPI.deleteWorkshop(eventId);
      setEvents(prev => prev.filter(item => item._id !== eventId));
      setSuccess('Hackathon deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hackathon');
    }
  };

  const exportRegistrations = async (eventId) => {
    try {
      const response = await registrationAPI.exportRegistrations(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const event = events.find(item => item._id === eventId);
      link.href = url;
      link.setAttribute('download', `${event?.title || 'hackathon'}-registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Registrations exported successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export registrations');
    }
  };

  const downloadReport = async (eventId) => {
    try {
      const response = await workshopAPI.downloadReport(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }));
      const link = document.createElement('a');
      const event = events.find(item => item._id === eventId);
      link.href = url;
      link.setAttribute('download', `${event?.title || 'hackathon'}-${getEventLabel(event, 'lower')}-report.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Hackathon report downloaded successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    }
  };

  const toggleRegistrations = async (eventId) => {
    try {
      const response = await workshopAPI.toggleRegistrationStatus(eventId);
      updateEventInState(response.data.workshop);
      setSuccess(`Registrations ${response.data.workshop.registrationsOpen ? 'opened' : 'closed'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update registration status');
    }
  };

  const toggleStopped = async (eventId) => {
    try {
      const response = await workshopAPI.toggleStoppedStatus(eventId);
      updateEventInState(response.data.workshop);
      setSuccess(`Hackathon ${response.data.workshop.isStopped ? 'hidden from users' : 'visible to users'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hackathon status');
    }
  };

  const totals = useMemo(() => events.reduce((stats, event) => {
    stats.total += event.totalRegistrationCount ?? event.registrationStats?.total ?? 0;
    stats.confirmed += event.confirmedRegistrationCount ?? event.registrationStats?.confirmed ?? 0;
    stats.rejected += event.rejectedRegistrationCount ?? event.registrationStats?.rejected ?? 0;
    if (event.hackathonLeaderboardVisible) stats.visibleLeaderboards += 1;
    return stats;
  }, { total: 0, confirmed: 0, rejected: 0, visibleLeaderboards: 0 }), [events]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard min-h-screen">
      <section className="hackathon-admin-hero">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <button
            onClick={() => navigate('/admin')}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-black text-secondary shadow-sm transition hover:bg-emerald-50"
          >
            <FiArrowLeft /> Back to Admin
          </button>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-primary">
                <FiShield /> Separate Hackathon Admin
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
                Hackathon Control Room
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold text-slate-600 sm:text-lg">
                Create hackathons, review confirmed teams, protect score changes with code, and publish leaderboards only when ready.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/hackathons/new')}
              className="admin-action-button primary justify-center text-base"
            >
              <FiPlus /> <span>Create Hackathon</span>
            </button>
          </div>

          <div className="admin-stat-grid">
            {[
              { label: 'Hackathons', value: events.length, icon: FiAward },
              { label: 'Teams Registered', value: totals.total, icon: FiUsers },
              { label: 'Confirmed Teams', value: totals.confirmed, icon: FiTrendingUp },
              { label: 'Visible Boards', value: totals.visibleLeaderboards, icon: FiBarChart2 }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="admin-stat-card" style={{ '--admin-delay': `${index * 80}ms` }}>
                  <div className="admin-stat-icon"><Icon /></div>
                  <p className="admin-stat-value">{stat.value}</p>
                  <p className="admin-stat-label">{stat.label}</p>
                  <p className="admin-stat-hint">{stat.label === 'Visible Boards' ? 'Shown only to confirmed teams' : 'Live hackathon metric'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        {events.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><FiAward /></div>
            <p>No hackathons created yet.</p>
            <button onClick={() => navigate('/admin/hackathons/new')} className="admin-action-button primary mx-auto mt-5">
              <FiPlus /> <span>Create First Hackathon</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map(event => (
              <AdminWorkshopCard
                key={event._id}
                workshop={event}
                onEdit={() => navigate(`/admin/workshops/${event._id}/edit`)}
                onDelete={deleteEvent}
                onViewRegistrations={(eventId) => navigate(`/admin/registrations/${eventId}`)}
                onExport={exportRegistrations}
                onReport={downloadReport}
                onEmail={() => {}}
                showEmail={false}
                onToggleRegistrations={toggleRegistrations}
                onToggleStopped={toggleStopped}
                onTakeAttendance={(eventId) => navigate(`/admin/attendance/${eventId}`)}
                onAttendanceReports={(eventId) => navigate(`/admin/attendance/${eventId}/reports`)}
                onEntryManagement={(eventId) => navigate(`/admin/entry/${eventId}`)}
                onCertificates={(eventId) => navigate(`/admin/certificates/${eventId}`)}
                onHackathonEvaluation={(eventId) => navigate(`/admin/hackathon/${eventId}/evaluation`)}
                onProblemStatements={(eventId) => navigate(`/admin/hackathon/${eventId}/problem-statements`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
