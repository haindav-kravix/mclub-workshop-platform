import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { workshopAPI, registrationAPI, resolveMediaUrl } from '../utils/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiClock, FiMapPin, FiArrowLeft, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatTimeRange12Hour, formatWorkshopTime } from '../utils/formatters';
import { getEventLabel } from '../utils/eventLabels';

export const WorkshopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('');

  useEffect(() => {
    const fetchWorkshop = async () => {
      try {
        const [workshopResponse, registrationsResponse] = await Promise.all([
          workshopAPI.getWorkshopById(id),
          isAuthenticated ? registrationAPI.getUserRegistrations() : Promise.resolve({ data: [] })
        ]);
        setWorkshop(workshopResponse.data);
        const currentRegistration = registrationsResponse.data.find(registration => {
          const registeredWorkshopId = registration.workshopId?._id || registration.workshopId;
          return registeredWorkshopId === id;
        });
        setRegistrationStatus(currentRegistration?.status || '');
      } catch (err) {
        setError('Failed to load workshop details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshop();
  }, [id, isAuthenticated]);

  if (loading) return <LoadingSpinner />;

  if (!workshop) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
        <button
          onClick={() => navigate('/workshops')}
          className="text-primary hover:underline"
        >
          Back to Events
        </button>
      </div>
    </div>
  );

  const registrationsOpen = workshop.registrationsOpen !== false && !workshop.isStopped;
  const eventLabel = getEventLabel(workshop);
  const eventLower = getEventLabel(workshop, 'lower');

  return (
    <div className="min-h-screen app-shell">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/workshops')}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition font-medium"
          >
            <FiArrowLeft /> <span>Back to Events</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        {/* Cover Image */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-64 sm:h-80 md:h-96 bg-slate-100 panel">
          {workshop.coverImage ? (
            <img
              src={resolveMediaUrl(workshop.coverImage)}
              alt={workshop.title}
              className="w-full h-full object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/brand/klh-head-banner.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-6xl font-bold">
              {workshop.title.charAt(0)}
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="panel rounded-lg p-4 sm:p-8 mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 break-words">{workshop.title}</h1>
          <div className={`inline-flex mb-5 rounded-lg px-3 py-1 text-sm font-bold ${
            registrationsOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {eventLabel} Registrations {registrationsOpen ? 'Open' : 'Closed'}
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 py-6 border-t border-b border-slate-200">
            <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-4 soft-border">
              <FiCalendar className="text-primary text-2xl" />
              <div>
                <p className="text-gray-600 text-sm">Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(workshop.startDate || workshop.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {workshop.endDate && workshop.endDate !== (workshop.startDate || workshop.date) ? ` - ${new Date(workshop.endDate).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-4 soft-border">
              <FiClock className="text-primary text-2xl" />
              <div>
                <p className="text-gray-600 text-sm">{formatWorkshopTime(workshop) ? 'Time & Duration' : 'Duration'}</p>
                <p className="font-semibold text-gray-900">
                  {formatWorkshopTime(workshop) ? `${formatWorkshopTime(workshop)} (${workshop.duration})` : workshop.duration}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-4 soft-border">
              <FiMapPin className="text-primary text-2xl" />
              <div>
                <p className="text-gray-600 text-sm">Venue</p>
                <p className="font-semibold text-gray-900">{workshop.venue}</p>
              </div>
            </div>

            {workshop.capacity && (
              <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-4 soft-border">
                <FiCalendar className="text-primary text-2xl" />
                <div>
                  <p className="text-gray-600 text-sm">Capacity</p>
                  <p className="font-semibold text-gray-900">{workshop.capacity} seats</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This {eventLabel}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{workshop.description}</p>
          </div>

          {workshop.dailyTimings?.some(timing => timing.startTime || timing.endTime) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {workshop.dailyTimings.filter(timing => timing.startTime || timing.endTime).map((timing) => (
                  <div key={`${timing.date}-${timing.startTime}`} className="rounded-lg bg-slate-50 p-4 soft-border">
                    <p className="font-semibold text-slate-900">{new Date(timing.date).toLocaleDateString()}</p>
                    <p className="text-slate-600">{formatTimeRange12Hour(timing.startTime, timing.endTime)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Button */}
          {registrationStatus === 'confirmed' ? (
            <div className="grid gap-3">
              <div className="w-full px-6 py-3 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-lg text-center">
                Registration Confirmed
              </div>
              {workshop.telegramLink && (
                <a
                  href={workshop.telegramLink}
                  target="_blank"
                  rel="noreferrer"
                  className="telegram-button w-full px-6 py-4 bg-secondary text-white rounded-lg font-bold text-lg hover:bg-secondary/90 transition flex items-center justify-center gap-3"
                >
                  <FiSend />
                  Join Telegram Group
                </a>
              )}
            </div>
          ) : registrationStatus === 'pending' ? (
            <div className="w-full px-6 py-3 bg-amber-50 text-amber-800 rounded-lg font-bold text-lg text-center">
              Reviewing your registration. Check My Events for your status.
            </div>
          ) : registrationStatus === 'rejected' ? (
            <div className="w-full px-6 py-3 bg-rose-50 text-rose-700 rounded-lg font-bold text-lg text-center">
              Registration rejected. Contact guidance for help.
            </div>
          ) : isAuthenticated && registrationsOpen ? (
            <button
              onClick={() => navigate(`/workshop/${id}/register`)}
              className="w-full px-6 py-3 bg-slate-950 text-white rounded-lg font-bold text-lg hover:bg-slate-800 transition"
            >
              Register Now
            </button>
          ) : isAuthenticated ? (
            <div className="w-full px-6 py-3 bg-amber-50 text-amber-700 rounded-lg font-bold text-lg text-center">
              Registrations Closed
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-900 font-medium">
                Please <a href="/login" className="underline hover:no-underline">sign in</a> to register for this {eventLower}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
