import React, { useState, useEffect } from 'react';
import { registrationAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage } from '../components/UI';
import { FiCalendar, FiMapPin, FiClock, FiSend } from 'react-icons/fi';

export const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await registrationAPI.getUserRegistrations();
        setRegistrations(response.data);
      } catch (err) {
        setError('Failed to load your registrations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  if (loading) return <LoadingSpinner />;

  const getFieldLabel = (registration, fieldId) => {
    const field = registration.workshopId?.registrationFormFields?.find(item => item.fieldId === fieldId);
    return field?.label || fieldId;
  };

  return (
    <div className="min-h-screen app-shell">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
        <div className="panel rounded-lg p-5 sm:p-8 mb-8">
          <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">Your events</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">My Workshop Registrations</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            View your registered workshops and submitted information.
          </p>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {registrations.length === 0 ? (
          <div className="panel rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">You haven't registered for any workshops yet</p>
            <a href="/workshops" className="text-primary hover:underline font-semibold">
              Browse Workshops →
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map(registration => (
              <div key={registration._id} className="panel rounded-lg overflow-hidden hover:shadow-xl transition">
                <div className="grid md:grid-cols-4 gap-4 p-6">
                  {/* Workshop Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {registration.workshopId.title}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FiCalendar size={16} />
                        <span>{new Date(registration.workshopId.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiClock size={16} />
                        <span>{registration.workshopId.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiMapPin size={16} />
                        <span>{registration.workshopId.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Status */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Registration Status</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      registration.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : registration.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="flex items-end">
                    {registration.workshopId.telegramLink ? (
                      <a
                        href={registration.workshopId.telegramLink}
                        target="_blank"
                        rel="noreferrer"
                        className="telegram-button w-full px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition flex items-center justify-center space-x-2 font-semibold"
                      >
                        <FiSend size={18} />
                        <span>Join Telegram</span>
                      </a>
                    ) : (
                      <div className="w-full px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-center font-semibold">
                        Registered
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Data */}
                {Object.keys(registration.formData).length > 0 && (
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Submitted Information</p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(registration.formData).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-gray-600">{getFieldLabel(registration, key)}</p>
                          <p className="text-gray-900 font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
