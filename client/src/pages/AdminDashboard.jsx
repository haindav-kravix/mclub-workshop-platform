import React, { useState, useEffect } from 'react';
import { workshopAPI, registrationAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../components/UI';
import { AdminWorkshopCard } from '../components/AdminWorkshopCard';
import { FiActivity, FiAward, FiBarChart2, FiCalendar, FiCheckCircle, FiClock, FiMail, FiPlus, FiTrendingUp, FiUsers, FiX, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getEventLabel } from '../utils/eventLabels';

export const AdminDashboard = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailWorkshop, setEmailWorkshop] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await workshopAPI.getAdminWorkshops({ excludeEventType: 'hackathon' });
      setWorkshops(response.data);
    } catch (err) {
      setError('Failed to load workshops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    const item = workshops.find(w => w._id === workshopId);
    const label = getEventLabel(item, 'lower');
    if (window.confirm(`Are you sure you want to delete this ${label}? This action cannot be undone.`)) {
      try {
        await workshopAPI.deleteWorkshop(workshopId);
        setWorkshops(workshops.filter(w => w._id !== workshopId));
        setSuccess(`${getEventLabel(item)} deleted successfully`);
      } catch (err) {
        setError('Failed to delete workshop');
        console.error(err);
      }
    }
  };

  const handleExportRegistrations = async (workshopId) => {
    try {
      const response = await registrationAPI.exportRegistrations(workshopId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const workshop = workshops.find(w => w._id === workshopId);
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

  const handleDownloadReport = async (workshopId) => {
    try {
      const response = await workshopAPI.downloadReport(workshopId);
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }));
      const link = document.createElement('a');
      link.href = url;
      const workshop = workshops.find(w => w._id === workshopId);
      link.setAttribute('download', `${workshop.title}-${getEventLabel(workshop, 'lower')}-report.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess(`${getEventLabel(workshop)} report downloaded successfully`);
    } catch (err) {
      setError('Failed to generate workshop report');
      console.error(err);
    }
  };

  const updateWorkshopInState = (updatedWorkshop) => {
    setWorkshops(prev => prev.map(workshop =>
      workshop._id === updatedWorkshop._id ? updatedWorkshop : workshop
    ));
  };

  const handleToggleRegistrations = async (workshopId) => {
    try {
      const response = await workshopAPI.toggleRegistrationStatus(workshopId);
      updateWorkshopInState(response.data.workshop);
      setSuccess(`Registrations ${response.data.workshop.registrationsOpen ? 'opened' : 'closed'}`);
    } catch (err) {
      setError('Failed to update registration status');
      console.error(err);
    }
  };

  const handleToggleStopped = async (workshopId) => {
    try {
      const response = await workshopAPI.toggleStoppedStatus(workshopId);
      updateWorkshopInState(response.data.workshop);
      setSuccess(`${getEventLabel(response.data.workshop)} ${response.data.workshop.isStopped ? 'stopped' : 'resumed'}`);
    } catch (err) {
      setError('Failed to update workshop status');
      console.error(err);
    }
  };

  const openEmailComposer = (workshop) => {
    setEmailWorkshop(workshop);
    setEmailForm({
      subject: `Update for ${workshop.title}`,
      message: `Hello,\n\nThis is an update about ${workshop.title}.\n\nRegards,\nMongoDB Club`
    });
  };

  const handleSendEmails = async () => {
    if (!emailWorkshop) return;

    setEmailLoading(true);
    try {
      const response = await registrationAPI.getWorkshopRegistrations(emailWorkshop._id);
      const emails = response.data
        .filter(registration => registration.status === 'confirmed')
        .map(registration => registration.userId?.email)
        .filter(Boolean);

      if (emails.length === 0) {
        setError('No confirmed student emails found for this workshop');
        return;
      }

      const gmailUrl = new URL('https://mail.google.com/mail/');
      gmailUrl.searchParams.set('view', 'cm');
      gmailUrl.searchParams.set('fs', '1');
      gmailUrl.searchParams.set('bcc', emails.join(','));
      gmailUrl.searchParams.set('su', emailForm.subject);
      gmailUrl.searchParams.set('body', emailForm.message);

      window.open(gmailUrl.toString(), '_blank', 'noopener,noreferrer');
      setSuccess(`Opened Gmail compose for ${emails.length} confirmed students`);
      setEmailWorkshop(null);
    } catch (err) {
      setError('Failed to collect registered student emails');
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalRegistrations = workshops.reduce((total, workshop) => total + (workshop.totalRegistrationCount ?? workshop.registrationStats?.total ?? workshop.registrationCount ?? 0), 0);
  const confirmedRegistrations = workshops.reduce((total, workshop) => total + (workshop.confirmedRegistrationCount ?? workshop.registrationStats?.confirmed ?? workshop.registrationCount ?? 0), 0);
  const rejectedRegistrations = workshops.reduce((total, workshop) => total + (workshop.rejectedRegistrationCount ?? workshop.registrationStats?.rejected ?? 0), 0);
  const runningEvents = workshops.filter(workshop => !workshop.isStopped).length;
  const openRegistrations = workshops.filter(workshop => workshop.registrationsOpen !== false).length;
  const confirmationRate = totalRegistrations ? Math.round((confirmedRegistrations / totalRegistrations) * 100) : 0;
  const topEvent = [...workshops].sort((a, b) => {
    const aTotal = a.totalRegistrationCount ?? a.registrationStats?.total ?? a.registrationCount ?? 0;
    const bTotal = b.totalRegistrationCount ?? b.registrationStats?.total ?? b.registrationCount ?? 0;
    return bTotal - aTotal;
  })[0];
  const statCards = [
    { label: 'Total Events', value: workshops.length, icon: FiCalendar, hint: `${runningEvents} running now` },
    { label: 'Registrations', value: totalRegistrations, icon: FiUsers, hint: `${openRegistrations} open for registration` },
    { label: 'Confirmed', value: confirmedRegistrations, icon: FiCheckCircle, hint: `${confirmationRate}% confirmation rate` },
    { label: 'Rejected', value: rejectedRegistrations, icon: FiXCircle, hint: 'Filtered in registrations' }
  ];
  const quickActions = [
    { label: 'Create Event', icon: FiPlus, onClick: () => navigate('/admin/workshops/new'), primary: true },
    { label: 'Hackathon Admin', icon: FiAward, onClick: () => navigate('/admin/hackathons') },
    { label: 'Analytics', icon: FiBarChart2, onClick: () => navigate('/admin/analytics') },
    { label: 'Club Highlights', icon: FiAward, onClick: () => navigate('/admin/achievements') }
  ];

  return (
    <div className="admin-dashboard min-h-screen">
      <section className="admin-hero">
        <div className="admin-hero-grid" aria-hidden="true" />
        <div className="admin-hero-orb orb-a" aria-hidden="true" />
        <div className="admin-hero-orb orb-b" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div className="admin-hero-copy">
              <div className="admin-kicker"><FiActivity /> Live control room</div>
              <h1>Admin Dashboard</h1>
              <p>Manage workshops, internships, registrations, attendance, certificates, reports, emails, and public club highlights from one focused workspace.</p>
            </div>
            <div className="admin-command-panel">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Quick actions</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Start faster</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} onClick={action.onClick} className={`admin-action-button ${action.primary ? 'primary' : ''}`}>
                      <Icon /> <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="admin-stat-grid">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="admin-stat-card" style={{ '--admin-delay': `${index * 90}ms` }}>
                  <div className="admin-stat-icon"><Icon /></div>
                  <p className="admin-stat-value">{stat.value}</p>
                  <p className="admin-stat-label">{stat.label}</p>
                  <p className="admin-stat-hint">{stat.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <section className="admin-insight-grid mb-8">
          <div className="admin-insight-card">
            <div className="admin-insight-icon"><FiTrendingUp /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Top event</p>
              <h2>{topEvent?.title || 'No event yet'}</h2>
              <p>{topEvent ? `${topEvent.totalRegistrationCount ?? topEvent.registrationStats?.total ?? topEvent.registrationCount ?? 0} registrations recorded` : 'Create your first event to start tracking performance.'}</p>
            </div>
          </div>
          <div className="admin-insight-card">
            <div className="admin-insight-icon"><FiBarChart2 /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Event health</p>
              <h2>{confirmationRate}% confirmed</h2>
              <p>{confirmedRegistrations} confirmed students out of {totalRegistrations} total registrations.</p>
            </div>
          </div>
          <div className="admin-insight-card">
            <div className="admin-insight-icon"><FiClock /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Visibility</p>
              <h2>{runningEvents} running</h2>
              <p>{openRegistrations} events currently accepting registrations.</p>
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-secondary">Event operations</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Manage events</h2>
          </div>
          <button onClick={() => navigate('/admin/workshops/new')} className="admin-action-button primary w-full sm:w-auto">
            <FiPlus /> <span>Create Event</span>
          </button>
        </div>

        {workshops.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><FiCalendar /></div>
            <p>You haven't created any workshops or internships yet</p>
            <button
              onClick={() => navigate('/admin/workshops/new')}
              className="admin-action-button primary mx-auto mt-5"
            >
              <FiPlus /> <span>Create Your First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {workshops.map(workshop => (
              <AdminWorkshopCard
                key={workshop._id}
                workshop={workshop}
                onEdit={(workshop) => navigate(`/admin/workshops/${workshop._id}/edit`)}
                onDelete={handleDeleteWorkshop}
                onViewRegistrations={(workshopId) => navigate(`/admin/registrations/${workshopId}`)}
                onExport={handleExportRegistrations}
                onReport={handleDownloadReport}
                onEmail={openEmailComposer}
                onToggleRegistrations={handleToggleRegistrations}
                onToggleStopped={handleToggleStopped}
                onTakeAttendance={(workshopId) => navigate(`/admin/attendance/${workshopId}`)}
                onAttendanceReports={(workshopId) => navigate(`/admin/attendance/${workshopId}/reports`)}
                onEntryManagement={(workshopId) => navigate(`/admin/entry/${workshopId}`)}
                onCertificates={(workshopId) => navigate(`/admin/certificates/${workshopId}`)}
                onHackathonEvaluation={(workshopId) => navigate(`/admin/hackathon/${workshopId}/evaluation`)}
              />
            ))}
          </div>
        )}
      </div>

      {emailWorkshop && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-sky-600">Email registered students</p>
                <h2 className="text-xl font-bold text-slate-950">{emailWorkshop.title}</h2>
              </div>
              <button onClick={() => setEmailWorkshop(null)} className="text-slate-500 hover:text-slate-900">
                <FiX size={22} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea
                  rows="7"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus-ring"
                />
              </div>
              <button
                onClick={handleSendEmails}
                disabled={emailLoading || !emailForm.subject || !emailForm.message}
                className="w-full px-4 py-3 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiMail />
                {emailLoading ? 'Preparing...' : 'Open in Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
