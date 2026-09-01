import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { CreateWorkshopModal } from '../components/CreateWorkshopModal';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { workshopAPI } from '../utils/api';
import { getEventLabel } from '../utils/eventLabels';

export const WorkshopFormPage = ({ defaultEventType = 'workshop', allowedEventTypes = ['workshop', 'internship'] }) => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(workshopId);
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    const fetchWorkshop = async () => {
      try {
        const response = await workshopAPI.getAdminWorkshopById(workshopId);
        setWorkshop(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load workshop');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshop();
  }, [isEditing, workshopId]);

  const buildFormData = (workshopData) => {
    const formData = new FormData();
    Object.keys(workshopData).forEach(key => {
      if (key === 'registrationFormFields' || key === 'dailyTimings') {
        formData.append(key, JSON.stringify(workshopData[key]));
      } else if (key !== 'coverImage' && key !== 'qrImage' && key !== 'hasTimings') {
        formData.append(key, workshopData[key] ?? '');
      }
    });

    if (workshopData.coverImage) {
      formData.append('coverImage', workshopData.coverImage);
    }
    if (workshopData.qrImage) {
      formData.append('qrImage', workshopData.qrImage);
    }

    return formData;
  };

  const handleSubmit = async (workshopData) => {
    setError('');
    const submittedLabel = getEventLabel(workshopData);
    try {
      if (isEditing) {
        await workshopAPI.updateWorkshop(workshopId, buildFormData(workshopData));
        setSuccess(`${submittedLabel} updated successfully`);
      } else {
        await workshopAPI.createWorkshop(buildFormData(workshopData));
        setSuccess(`${submittedLabel} created successfully`);
      }

      setTimeout(() => navigate('/admin'), 600);
    } catch (err) {
      const message = err.response?.data?.message || (isEditing ? 'Failed to update workshop' : 'Failed to create workshop');
      setError(message);
      throw new Error(message);
    }
  };

  if (loading) return <LoadingSpinner />;
  const eventLabel = getEventLabel(workshop);
  const eventLower = getEventLabel(workshop, 'lower');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:py-7">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          <p className="text-xs font-black uppercase tracking-wide text-secondary">
            {isEditing ? `${eventLabel} management` : 'Create event'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            {isEditing ? `Edit ${eventLabel}` : 'Create New Event'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
            {isEditing ? `Update ${eventLower} details, optional timings, images, and registration questions.` : 'Choose the event type, then add details, optional timings, images, and registration questions.'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <CreateWorkshopModal
          layout="page"
          initialData={workshop}
          defaultEventType={defaultEventType}
          allowedEventTypes={allowedEventTypes}
          onClose={() => navigate('/admin')}
          onCreate={handleSubmit}
        />
      </div>
    </div>
  );
};
