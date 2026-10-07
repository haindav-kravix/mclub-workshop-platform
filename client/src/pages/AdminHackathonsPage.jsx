import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiBarChart2, FiEye, FiEyeOff, FiLink, FiMail, FiPlus, FiSave, FiShield, FiTrendingUp, FiUsers, FiX } from 'react-icons/fi';
import { AdminWorkshopCard } from '../components/AdminWorkshopCard';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { certificateAPI, registrationAPI, workshopAPI } from '../utils/api';
import { getEventLabel } from '../utils/eventLabels';
import { copyEmailsToClipboard, getConfirmedParticipantEmails, openGmailCompose } from '../utils/emailRecipients';

export const AdminHackathonsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailEvent, setEmailEvent] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [solutionEventId, setSolutionEventId] = useState('');
  const [solutionForm, setSolutionForm] = useState({ url: '', visible: false });
  const [solutionSaving, setSolutionSaving] = useState(false);
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

  const openSolutionSettings = (event) => {
    if (solutionEventId === event._id) {
      setSolutionEventId('');
      return;
    }
    setSolutionEventId(event._id);
    setSolutionForm({
      url: event.hackathonSolutionSubmissionUrl || '',
      visible: Boolean(event.hackathonSolutionSubmissionVisible)
    });
  };

  const saveSolutionSettings = async (eventId) => {
    setError('');
    setSolutionSaving(true);
    try {
      const response = await workshopAPI.updateHackathonSolutionSubmission(eventId, solutionForm);
      const current = events.find(event => event._id === eventId);
      updateEventInState({ ...current, ...response.data.workshop });
      setSuccess(response.data.message);
      setSolutionEventId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the submission link');
    } finally {
      setSolutionSaving(false);
    }
  };

  const deleteCertificates = async (event) => {
    if (!window.confirm(`Delete all ${event.certificateCount} issued certificates for ${event.title}? This removes them from every recipient profile and cannot be undone.`)) return;
    try {
      const response = await certificateAPI.removeAllForWorkshop(event._id);
      updateEventInState({ ...event, certificateCount: 0 });
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete issued certificates');
    }
  };

  const openEmailComposer = (event) => {
    setEmailEvent(event);
    setEmailForm({
      subject: `Update for ${event.title}`,
      message: `Hello,\n\nThis is an update about ${event.title}.\n\nRegards,\nMongoDB Club`
    });
  };

  const sendEmails = async () => {
    if (!emailEvent) return;

    setEmailLoading(true);
    try {
      const response = await registrationAPI.getWorkshopRegistrations(emailEvent._id);
      const emails = getConfirmedParticipantEmails(response.data);

      if (emails.length === 0) {
        setError('No confirmed participant emails were found for this hackathon');
        return;
      }

      await copyEmailsToClipboard(emails);
      openGmailCompose({ emails: [], subject: emailForm.subject, message: emailForm.message });
      window.alert(`${emails.length} participant emails were copied. In Gmail, click Bcc and paste them using Ctrl+V or Command+V.`);
      setSuccess(`Copied all ${emails.length} confirmed participant emails`);
      setEmailEvent(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to collect confirmed participant emails');
    } finally {
      setEmailLoading(false);
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
              <div key={event._id} className="space-y-3">
              <AdminWorkshopCard
                workshop={event}
                onEdit={() => navigate(`/admin/workshops/${event._id}/edit`)}
                onDelete={deleteEvent}
                onViewRegistrations={(eventId) => navigate(`/admin/registrations/${eventId}`)}
                onExport={exportRegistrations}
                onReport={downloadReport}
                onEmail={openEmailComposer}
                onToggleRegistrations={toggleRegistrations}
                onToggleStopped={toggleStopped}
                onTakeAttendance={(eventId) => navigate(`/admin/hackathon/${eventId}/attendance`)}
                onAttendanceReports={(eventId) => navigate(`/admin/hackathon/${eventId}/attendance/reports`)}
                onEntryManagement={(eventId) => navigate(`/admin/entry/${eventId}`)}
                onCertificates={(eventId) => navigate(`/admin/certificates/${eventId}`)}
                onDeleteCertificates={deleteCertificates}
                onHackathonEvaluation={(eventId) => navigate(`/admin/hackathon/${eventId}/evaluation`)}
                onProblemStatements={(eventId) => navigate(`/admin/hackathon/${eventId}/problem-statements`)}
                onFinalSubmission={(eventId) => navigate(`/admin/hackathon/${eventId}/final-submission`)}
              />
              <button
                type="button"
                onClick={() => openSolutionSettings(event)}
                className="flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-white px-4 py-3 text-left font-black text-slate-900 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <span className="flex items-center gap-2"><FiLink className="text-emerald-600" /> Solution submission</span>
                <span className={`flex items-center gap-1 text-xs uppercase ${event.hackathonSolutionSubmissionVisible ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {event.hackathonSolutionSubmissionVisible ? <FiEye /> : <FiEyeOff />}
                  {event.hackathonSolutionSubmissionVisible ? 'Visible' : 'Hidden'}
                </span>
              </button>
              {solutionEventId === event._id && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <label className="text-xs font-black uppercase tracking-wide text-emerald-800" htmlFor={`solution-url-${event._id}`}>Submission link</label>
                  <input
                    id={`solution-url-${event._id}`}
                    type="url"
                    inputMode="url"
                    placeholder="https://forms.google.com/..."
                    value={solutionForm.url}
                    onChange={(inputEvent) => setSolutionForm(previous => ({ ...previous, url: inputEvent.target.value }))}
                    className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={() => setSolutionForm(previous => ({ ...previous, visible: !previous.visible }))}
                    className={`mt-3 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-black transition ${solutionForm.visible ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
                  >
                    <span>{solutionForm.visible ? 'Visible to confirmed teams' : 'Hidden from teams'}</span>
                    {solutionForm.visible ? <FiEye /> : <FiEyeOff />}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSolutionSettings(event._id)}
                    disabled={solutionSaving}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <FiSave /> {solutionSaving ? 'Saving...' : 'Save Submission Settings'}
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {emailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Email confirmed participants</p>
                <h2 className="text-xl font-bold text-slate-950">{emailEvent.title}</h2>
              </div>
              <button onClick={() => setEmailEvent(null)} className="text-slate-500 hover:text-slate-900" aria-label="Close email composer">
                <FiX size={22} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm font-semibold text-slate-600">
                Every confirmed team leader and member will be copied. Gmail opens with the message ready; paste the copied list once into Bcc.
              </p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(event) => setEmailForm(previous => ({ ...previous, subject: event.target.value }))}
                  className="focus-ring w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  rows="7"
                  value={emailForm.message}
                  onChange={(event) => setEmailForm(previous => ({ ...previous, message: event.target.value }))}
                  className="focus-ring w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>
              <button
                onClick={sendEmails}
                disabled={emailLoading || !emailForm.subject.trim() || !emailForm.message.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <FiMail /> {emailLoading ? 'Preparing...' : 'Copy All Emails & Open Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
