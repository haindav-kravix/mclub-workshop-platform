import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage } from '../components/UI';
import { FiAlertCircle, FiArrowUpRight, FiBarChart2, FiBookOpen, FiCalendar, FiEdit3, FiMapPin, FiClock, FiSend, FiShield } from 'react-icons/fi';
import { formatWorkshopTime } from '../utils/formatters';
import { ProblemStatementContent } from '../components/ProblemStatementContent';
import { RegistrationCorrectionModal } from '../components/RegistrationCorrectionModal';

export const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRegistration, setEditingRegistration] = useState(null);

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

  const submitCorrection = async (registrationId, payload) => {
    await registrationAPI.submitCorrection(registrationId, payload);
    const response = await registrationAPI.getUserRegistrations();
    setRegistrations(response.data);
    setEditingRegistration(null);
  };

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
                      {formatWorkshopTime(registration.workshopId) && (
                        <div className="flex items-center space-x-2">
                          <FiClock size={16} />
                          <span>{formatWorkshopTime(registration.workshopId)}</span>
                        </div>
                      )}
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
                    {registration.status === 'confirmed' ? (
                      <div className="grid w-full gap-2">
                        {registration.workshopId?.entryPassEnabled !== false && (
                          <Link
                            to={`/entry-pass/${registration._id}`}
                            className="entry-pass-mini-button w-full px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2 font-black"
                          >
                            <FiShield size={18} />
                            <span>View Entry Pass</span>
                          </Link>
                        )}
                        {registration.workshopId?.eventType === 'hackathon' && registration.workshopId?.hackathonLeaderboardVisible && (
                          <Link
                            to={`/hackathon/${registration.workshopId._id}/leaderboard`}
                            className="w-full px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2 font-black bg-violet-50 text-violet-700 hover:bg-violet-100"
                          >
                            <FiBarChart2 size={18} />
                            <span>Leaderboard</span>
                          </Link>
                        )}
                        {registration.workshopId?.eventType === 'hackathon' && (
                          <Link
                            to={`/hackathon/${registration.workshopId._id}/problem-statements`}
                            className="w-full px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2 font-black bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          >
                            <FiBookOpen size={18} />
                            <span>{registration.selectedProblemStatement?.statementId ? 'View Problem Statement' : 'Select Problem Statement'}</span>
                          </Link>
                        )}
                        {registration.workshopId?.eventType === 'hackathon' && registration.workshopId?.hackathonFinalSubmissionEnabled && (
                          <Link
                            to={`/hackathon/${registration.workshopId._id}/final-submission`}
                            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-black text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                          >
                            <FiSend size={18} />
                            <span>{registration.finalSubmission?.submittedAt ? 'View Final Submission' : (registration.workshopId.hackathonFinalSubmissionTitle || 'Submit Final Details')}</span>
                            <FiArrowUpRight />
                          </Link>
                        )}
                        {registration.workshopId?.eventType === 'hackathon' &&
                          registration.workshopId?.hackathonSolutionSubmissionVisible &&
                          registration.workshopId?.hackathonSolutionSubmissionUrl && (
                          <a
                            href={registration.workshopId.hackathonSolutionSubmissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-black text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                          >
                            <FiSend size={18} />
                            <span>Submit Solution</span>
                            <FiArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
                        )}
                        {registration.workshopId.telegramLink && (
                          <a
                            href={registration.workshopId.telegramLink}
                            target="_blank"
                            rel="noreferrer"
                            className="telegram-button w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition flex items-center justify-center space-x-2 font-semibold"
                          >
                            <FiSend size={18} />
                            <span>Join Telegram</span>
                          </a>
                        )}
                      </div>
                    ) : registration.status === 'pending' ? (
                      <div className="w-full px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-center font-semibold">
                        Reviewing your registration
                      </div>
                    ) : registration.status === 'rejected' ? (
                      <div className="w-full px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-center font-semibold">
                        Rejected
                      </div>
                    ) : (
                      <div className="w-full px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-center font-semibold">
                        {registration.status === 'confirmed' ? 'Confirmed' : 'Not confirmed'}
                      </div>
                    )}
                  </div>
                </div>

                {registration.status === 'rejected' && registration.rejectionReason && (
                  <div className="border-t border-rose-200 bg-rose-50 px-6 py-4">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-rose-700"><FiAlertCircle /> Reason for rejection</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-rose-900">{registration.rejectionReason}</p>
                  </div>
                )}

                {registration.editableFieldIds?.length > 0 && (
                  <div className="border-t border-blue-200 bg-blue-50 px-6 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700"><FiEdit3 /> Correction requested</p><p className="mt-1 text-sm font-semibold text-blue-950">Admin has opened {registration.editableFieldIds.length} field{registration.editableFieldIds.length === 1 ? '' : 's'} for correction.</p></div>
                      <button type="button" onClick={() => setEditingRegistration(registration)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-blue-700"><FiEdit3 /> Edit Requested Details</button>
                    </div>
                  </div>
                )}

                {/* Form Data */}
                {registration.teamCode && (
                  <div className="bg-emerald-50 px-6 py-4 border-t border-emerald-100">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Hackathon team name</p>
                    <p className="mt-1 text-2xl font-black tracking-widest text-slate-950">{registration.teamCode}</p>
                    {registration.teamMembers?.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {registration.teamMembers.map((member, index) => (
                          <div key={member._id || index} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2">
                            <div className="min-w-0"><p className="truncate text-sm font-black">{member.name}</p><p className="text-xs text-slate-500">Member {index + 1}</p></div>
                            <span className="rounded-md bg-slate-950 px-3 py-1 font-mono text-lg font-black text-white">{member.pin}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {registration.selectedProblemStatement?.statementId && (
                  <div className="border-t border-emerald-100 bg-white px-6 py-4">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Selected problem statement</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{registration.selectedProblemStatement.title}</p>
                    <ProblemStatementContent className="mt-3 text-sm font-medium">{registration.selectedProblemStatement.description}</ProblemStatementContent>
                  </div>
                )}
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
      {editingRegistration && <RegistrationCorrectionModal registration={editingRegistration} onClose={() => setEditingRegistration(null)} onSubmit={submitCorrection} />}
    </div>
  );
};
