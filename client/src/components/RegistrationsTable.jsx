import React, { useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiFileText, FiInbox, FiTrash2, FiX } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';
import { ProfileAvatar } from './ProfileAvatar';

const getFormValue = (formData, fieldId) => {
  if (!formData) return '';
  const value = formData[fieldId];
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
};

const getUploadedFileMeta = (value) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.dataUrl || parsed?.uploaded ? parsed : null;
  } catch {
    return null;
  }
};

const isInlineImage = (value) => typeof value === 'string' && value.startsWith('data:image/');

const buildFields = (registrations, formFields = []) => {
  const orderedFields = [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fields = orderedFields.map(field => ({
    id: field.fieldId,
    label: field.label || field.fieldId,
    type: field.type || 'text'
  }));
  const knownIds = new Set(fields.map(field => field.id));

  registrations.forEach((reg) => {
    Object.keys(reg.formData || {}).forEach((fieldId) => {
      if (!knownIds.has(fieldId)) {
        knownIds.add(fieldId);
        fields.push({ id: fieldId, label: fieldId, type: 'text' });
      }
    });
  });

  return fields;
};

const statusClass = (status) => ({
  confirmed: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-700'
}[status] || 'bg-slate-100 text-slate-700');

const StatusBadge = ({ status }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black capitalize ${statusClass(status)}`}>
    {status || 'pending'}
  </span>
);

const StudentAvatar = ({ user }) => (
  <ProfileAvatar
    user={user}
    className="h-11 w-11 flex-none rounded-full object-cover ring-2 ring-white"
    fallbackClassName="h-11 w-11 flex-none rounded-full bg-secondary text-sm text-white ring-2 ring-white"
  />
);

const RegistrationActions = ({ registration, loading, onUpdateRegistrationStatus, onDeleteRegistration, onReject }) => (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
    {registration.status !== 'confirmed' && registration.status !== 'cancelled' && (
      <button
        type="button"
        onClick={() => onUpdateRegistrationStatus(registration._id, 'confirmed')}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        title="Approve registration"
      >
        <FiCheck size={18} />
        Approve
      </button>
    )}
    {registration.status !== 'rejected' && registration.status !== 'cancelled' && (
      <button
        type="button"
        onClick={() => onReject(registration)}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-black text-amber-800 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        title="Reject registration"
      >
        <FiX size={18} />
        Reject
      </button>
    )}
    <button
      type="button"
      onClick={() => onDeleteRegistration(registration._id)}
      disabled={loading}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      title="Delete registration"
    >
      <FiTrash2 size={18} />
      Delete
    </button>
  </div>
);

export const RegistrationsTable = ({
  registrations,
  formFields = [],
  onDeleteRegistration,
  onUpdateRegistrationStatus,
  onViewPaymentScreenshot,
  loading,
  emptyMessage = 'No registrations yet'
}) => {
  const fields = useMemo(() => buildFields(registrations, formFields), [registrations, formFields]);
  const [rejectingRegistration, setRejectingRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  const closeRejection = () => {
    if (submittingRejection) return;
    setRejectingRegistration(null);
    setRejectionReason('');
  };

  const submitRejection = async (event) => {
    event.preventDefault();
    const reason = rejectionReason.trim();
    if (!reason || !rejectingRegistration) return;
    setSubmittingRejection(true);
    const updated = await onUpdateRegistrationStatus(rejectingRegistration._id, 'rejected', reason);
    setSubmittingRejection(false);
    if (updated) closeRejection();
  };

  return (
    <>
      <div className="registrations-table overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-secondary">Submitted students</p>
            <h2 className="text-xl font-black text-slate-950">Registration List</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">{registrations.length} records</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {registrations.map((reg) => (
          <article key={reg._id} className="registration-record p-4 transition hover:bg-emerald-50/30 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar user={reg.userId} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950">{reg.userId?.name || 'Unknown student'}</p>
                      <p className="break-all text-sm font-semibold text-slate-500">{reg.userId?.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={reg.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {fields.length > 0 && (
                  <dl className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {fields.map(field => (
                      <div key={field.id} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">{field.label}</dt>
                        {field.type === 'image' && getFormValue(reg.formData, field.id) ? (
                          <dd className="mt-2">
                            <button
                              type="button"
                              onClick={() => onViewPaymentScreenshot?.(reg._id, field.id)}
                              className="inline-flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                            >
                              {isInlineImage(getFormValue(reg.formData, field.id)) ? (
                                <img
                                  src={resolveMediaUrl(getFormValue(reg.formData, field.id))}
                                  alt={`${field.label} upload`}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-16 w-16 rounded-md object-cover"
                                />
                              ) : (
                                <span className="flex h-16 w-16 items-center justify-center rounded-md bg-emerald-50 text-secondary">
                                  <FiFileText size={22} />
                                </span>
                              )}
                              <span className="text-sm font-black text-secondary">View image</span>
                            </button>
                          </dd>
                        ) : field.type === 'file' && getFormValue(reg.formData, field.id) ? (
                          <dd className="mt-2">
                            <button
                              type="button"
                              onClick={() => onViewPaymentScreenshot?.(reg._id, field.id)}
                              className="inline-flex max-w-full items-center gap-3 rounded-lg border border-emerald-200 bg-white p-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                            >
                              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-emerald-50 text-secondary">
                                <FiFileText size={22} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-secondary">
                                  {getUploadedFileMeta(getFormValue(reg.formData, field.id))?.name || 'View file'}
                                </span>
                                <span className="block text-xs font-bold text-slate-500">Open upload</span>
                              </span>
                            </button>
                          </dd>
                        ) : (
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-slate-900">
                            {getFormValue(reg.formData, field.id) || '-'}
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                )}

                {reg.teamCode && (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Hackathon team name</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <p className="text-2xl font-black tracking-widest text-slate-950">{reg.teamCode}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                        Average: {reg.evaluationAverage || 0}
                      </span>
                    </div>
                  </div>
                )}

                {reg.status === 'rejected' && reg.rejectionReason && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-rose-700"><FiAlertCircle /> Rejection reason</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-rose-900">{reg.rejectionReason}</p>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Payment Screenshot</p>
                  {reg.paymentScreenshot ? (
                    <button
                      type="button"
                      onClick={() => onViewPaymentScreenshot?.(reg._id, 'paymentScreenshot')}
                      className="mt-2 inline-flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      {isInlineImage(reg.paymentScreenshot) ? (
                        <img
                          src={resolveMediaUrl(reg.paymentScreenshot)}
                          alt={`${reg.userId?.name || 'Student'} payment screenshot`}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-md bg-emerald-50 text-secondary">
                          <FiFileText size={22} />
                        </span>
                      )}
                      <span className="text-sm font-black text-secondary">View screenshot</span>
                    </button>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-500">Not uploaded</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:self-start">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Actions</p>
                <RegistrationActions
                  registration={reg}
                  loading={loading}
                  onUpdateRegistrationStatus={onUpdateRegistrationStatus}
                  onDeleteRegistration={onDeleteRegistration}
                  onReject={(registration) => {
                    setRejectingRegistration(registration);
                    setRejectionReason('');
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-14 text-center text-slate-500">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FiInbox size={22} />
          </div>
          <p className="font-black text-slate-700">{emptyMessage}</p>
          <p className="mt-1 text-sm">Students will appear here after they register.</p>
        </div>
      )}
      </div>

      {rejectingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reject-registration-title">
          <form onSubmit={submitRejection} className="w-full max-w-lg rounded-2xl border border-rose-100 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-rose-700">Registration decision</p>
                <h2 id="reject-registration-title" className="mt-1 text-2xl font-black text-slate-950">Why is this registration rejected?</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">This message will be visible to {rejectingRegistration.userId?.name || 'the applicant'} in My Events.</p>
              </div>
              <button type="button" onClick={closeRejection} disabled={submittingRejection} className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Close rejection dialog"><FiX /></button>
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">Reason for rejection</span>
              <textarea
                autoFocus
                required
                maxLength={500}
                value={rejectionReason}
                onChange={event => setRejectionReason(event.target.value)}
                className="min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                placeholder="Explain what is missing or why the registration cannot be accepted"
              />
              <span className="mt-1 block text-right text-xs font-bold text-slate-400">{rejectionReason.length}/500</span>
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={closeRejection} disabled={submittingRejection} className="min-h-12 rounded-xl border border-slate-200 bg-white font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={submittingRejection || !rejectionReason.trim()} className="min-h-12 rounded-xl bg-rose-600 font-black text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">{submittingRejection ? 'Rejecting...' : 'Reject Registration'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
