import React, { useState, useEffect } from 'react';
import { workshopAPI, registrationAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../components/UI';
import { AdminWorkshopCard } from '../components/AdminWorkshopCard';
import { FiCalendar, FiMail, FiPlus, FiUsers, FiX, FiZap } from 'react-icons/fi';
import { CreateWorkshopModal } from '../components/CreateWorkshopModal';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [emailWorkshop, setEmailWorkshop] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await workshopAPI.getAdminWorkshops();
      setWorkshops(response.data);
    } catch (err) {
      setError('Failed to load workshops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkshop = async (workshopData) => {
    try {
      const formData = new FormData();
      Object.keys(workshopData).forEach(key => {
        if (key === 'registrationFormFields' || key === 'dailyTimings') {
          formData.append(key, JSON.stringify(workshopData[key]));
        } else if (key !== 'coverImage') {
          formData.append(key, workshopData[key]);
        }
      });
      if (workshopData.coverImage) {
        formData.append('coverImage', workshopData.coverImage);
      }

      await workshopAPI.createWorkshop(formData);
      setSuccess('Workshop created successfully!');
      setShowCreateModal(false);
      fetchWorkshops();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workshop');
      console.error(err);
    }
  };

  const handleUpdateWorkshop = async (workshopData) => {
    try {
      const formData = new FormData();
      Object.keys(workshopData).forEach(key => {
        if (key === 'registrationFormFields' || key === 'dailyTimings') {
          formData.append(key, JSON.stringify(workshopData[key]));
        } else if (key !== 'coverImage') {
          formData.append(key, workshopData[key] ?? '');
        }
      });
      if (workshopData.coverImage) {
        formData.append('coverImage', workshopData.coverImage);
      }

      await workshopAPI.updateWorkshop(editingWorkshop._id, formData);
      setSuccess('Workshop updated successfully!');
      setEditingWorkshop(null);
      fetchWorkshops();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workshop');
      console.error(err);
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (window.confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) {
      try {
        await workshopAPI.deleteWorkshop(workshopId);
        setWorkshops(workshops.filter(w => w._id !== workshopId));
        setSuccess('Workshop deleted successfully');
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
      setSuccess(`Workshop ${response.data.workshop.isStopped ? 'stopped' : 'resumed'}`);
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
        .map(registration => registration.userId?.email)
        .filter(Boolean);

      if (emails.length === 0) {
        setError('No registered student emails found for this workshop');
        return;
      }

      const gmailUrl = new URL('https://mail.google.com/mail/');
      gmailUrl.searchParams.set('view', 'cm');
      gmailUrl.searchParams.set('fs', '1');
      gmailUrl.searchParams.set('bcc', emails.join(','));
      gmailUrl.searchParams.set('su', emailForm.subject);
      gmailUrl.searchParams.set('body', emailForm.message);

      window.open(gmailUrl.toString(), '_blank', 'noopener,noreferrer');
      setSuccess(`Opened Gmail compose for ${emails.length} registered students`);
      setEmailWorkshop(null);
    } catch (err) {
      setError('Failed to collect registered student emails');
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalRegistrations = workshops.reduce((total, workshop) => total + (workshop.registrationCount || 0), 0);
  const activeWorkshops = workshops.filter(workshop => workshop.isActive).length;
  const upcomingWorkshops = workshops.filter(workshop => new Date(workshop.date) >= new Date()).length;
  const statCards = [
    { label: 'Total Workshops', value: workshops.length, icon: FiCalendar },
    { label: 'Active Now', value: activeWorkshops, icon: FiZap },
    { label: 'Upcoming', value: upcomingWorkshops, icon: FiCalendar },
    { label: 'Registrations', value: totalRegistrations, icon: FiUsers }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-2">Shared admin portal</p>
              <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-300 mt-2">Every admin can manage every workshop, registration, and export.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-cyan-400 text-slate-950 rounded-lg hover:bg-cyan-300 transition font-bold"
            >
              <FiPlus /> <span>Create Workshop</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-slate-300">{stat.label}</p>
                    </div>
                    <Icon className="text-cyan-300" size={22} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        {workshops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">You haven't created any workshops yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold"
            >
              <FiPlus /> <span>Create Your First Workshop</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {workshops.map(workshop => (
              <AdminWorkshopCard
                key={workshop._id}
                workshop={workshop}
                onEdit={(workshop) => setEditingWorkshop(workshop)}
                onDelete={handleDeleteWorkshop}
                onViewRegistrations={(workshopId) => navigate(`/admin/registrations/${workshopId}`)}
                onExport={handleExportRegistrations}
                onEmail={openEmailComposer}
                onToggleRegistrations={handleToggleRegistrations}
                onToggleStopped={handleToggleStopped}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Workshop Modal */}
      {showCreateModal && (
        <CreateWorkshopModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkshop}
        />
      )}

      {editingWorkshop && (
        <CreateWorkshopModal
          initialData={editingWorkshop}
          onClose={() => setEditingWorkshop(null)}
          onCreate={handleUpdateWorkshop}
        />
      )}

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
