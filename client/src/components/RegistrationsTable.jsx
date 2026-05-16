import React from 'react';
import { FiCheck, FiInbox, FiTrash2, FiX } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';

const getFormValue = (formData, fieldId) => {
  if (!formData) return '';
  const value = formData[fieldId];
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
};

const buildFields = (registrations, formFields = []) => {
  const orderedFields = [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fields = orderedFields.map(field => ({
    id: field.fieldId,
    label: field.label || field.fieldId
  }));
  const knownIds = new Set(fields.map(field => field.id));

  registrations.forEach((reg) => {
    Object.keys(reg.formData || {}).forEach((fieldId) => {
      if (!knownIds.has(fieldId)) {
        knownIds.add(fieldId);
        fields.push({ id: fieldId, label: fieldId });
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

export const RegistrationsTable = ({
  registrations,
  formFields = [],
  onDeleteRegistration,
  onUpdateRegistrationStatus,
  loading
}) => {
  const fields = buildFields(registrations, formFields);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-secondary">Submitted students</p>
            <h2 className="text-xl font-black text-slate-950">Registration List</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">{registrations.length} records</p>
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Student</th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Date</th>
              {fields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((reg, index) => (
              <tr key={reg._id} className={index % 2 === 0 ? 'bg-white hover:bg-emerald-50/40' : 'bg-slate-50/50 hover:bg-emerald-50/40'}>
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm text-slate-900">
                  <div className="flex min-w-[180px] items-center gap-3">
                    {reg.userId?.profilePhoto ? (
                      <img
                        src={resolveMediaUrl(reg.userId.profilePhoto)}
                        alt={reg.userId.name}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                        {(reg.userId?.name || 'S').charAt(0)}
                      </div>
                    )}
                    <span className="font-bold">{reg.userId?.name || 'Unknown student'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-600">{reg.userId?.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600"><StatusBadge status={reg.status} /></td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-500">
                  {new Date(reg.createdAt).toLocaleDateString()}
                </td>
                {fields.map(field => (
                  <td key={field.id} className="max-w-[260px] px-4 py-3 text-sm font-medium text-slate-700">
                    <div className="line-clamp-3 break-words">
                    {getFormValue(reg.formData, field.id) || '-'}
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateRegistrationStatus(reg._id, 'confirmed')}
                        disabled={loading}
                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900 disabled:opacity-50"
                        title="Approve registration"
                      >
                        <FiCheck size={18} />
                      </button>
                    )}
                    {reg.status !== 'rejected' && reg.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateRegistrationStatus(reg._id, 'rejected')}
                        disabled={loading}
                        className="rounded-lg bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 hover:text-amber-900 disabled:opacity-50"
                        title="Reject registration"
                      >
                        <FiX size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRegistration(reg._id)}
                      disabled={loading}
                      className="rounded-lg bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
                      title="Delete registration"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-slate-100">
        {registrations.map((reg) => (
          <div key={reg._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {reg.userId?.profilePhoto ? (
                    <img
                      src={resolveMediaUrl(reg.userId.profilePhoto)}
                      alt={reg.userId.name}
                      className="h-10 w-10 flex-none rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                      {(reg.userId?.name || 'S').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{reg.userId?.name || 'Unknown student'}</p>
                    <p className="break-all text-sm font-semibold text-slate-500">{reg.userId?.email || '-'}</p>
                    <div className="mt-1"><StatusBadge status={reg.status} /></div>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {new Date(reg.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-none flex-col gap-1">
                {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateRegistrationStatus(reg._id, 'confirmed')}
                    disabled={loading}
                    className="rounded-lg bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                    title="Approve registration"
                  >
                    <FiCheck size={18} />
                  </button>
                )}
                {reg.status !== 'rejected' && reg.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateRegistrationStatus(reg._id, 'rejected')}
                    disabled={loading}
                    className="rounded-lg bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                    title="Reject registration"
                  >
                    <FiX size={18} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteRegistration(reg._id)}
                  disabled={loading}
                  className="rounded-lg bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  title="Delete registration"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            {fields.length > 0 && (
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(field => (
                  <div key={field.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{field.label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {getFormValue(reg.formData, field.id) || '-'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>

      {registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-14 text-center text-slate-500">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FiInbox size={22} />
          </div>
          <p className="font-black text-slate-700">No registrations yet</p>
          <p className="mt-1 text-sm">Students will appear here after they register.</p>
        </div>
      )}
    </div>
  );
};
