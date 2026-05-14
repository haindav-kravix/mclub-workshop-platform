import React from 'react';
import { FiCheck, FiTrash2, FiX } from 'react-icons/fi';
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
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(status)}`}>
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Registration Date</th>
              {fields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg, index) => (
              <tr key={reg._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    {reg.userId.profilePhoto && (
                      <img
                        src={resolveMediaUrl(reg.userId.profilePhoto)}
                        alt={reg.userId.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{reg.userId.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{reg.userId.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600"><StatusBadge status={reg.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(reg.createdAt).toLocaleDateString()}
                </td>
                {fields.map(field => (
                  <td key={field.id} className="px-4 py-3 text-sm text-gray-600 max-w-xs break-words">
                    {getFormValue(reg.formData, field.id) || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateRegistrationStatus(reg._id, 'confirmed')}
                        disabled={loading}
                        className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-2 rounded transition disabled:opacity-50"
                        title="Approve registration"
                      >
                        <FiCheck size={18} />
                      </button>
                    )}
                    {reg.status !== 'rejected' && reg.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateRegistrationStatus(reg._id, 'rejected')}
                        disabled={loading}
                        className="text-amber-700 hover:text-amber-900 hover:bg-amber-50 p-2 rounded transition disabled:opacity-50"
                        title="Reject registration"
                      >
                        <FiX size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRegistration(reg._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition disabled:opacity-50"
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

      <div className="lg:hidden divide-y divide-gray-100">
        {registrations.map((reg) => (
          <div key={reg._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {reg.userId.profilePhoto && (
                    <img
                      src={resolveMediaUrl(reg.userId.profilePhoto)}
                      alt={reg.userId.name}
                      className="w-8 h-8 rounded-full flex-none"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{reg.userId.name}</p>
                    <p className="text-sm text-gray-600 break-all">{reg.userId.email}</p>
                    <div className="mt-1"><StatusBadge status={reg.status} /></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(reg.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-none">
                {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateRegistrationStatus(reg._id, 'confirmed')}
                    disabled={loading}
                    className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-2 rounded transition disabled:opacity-50"
                    title="Approve registration"
                  >
                    <FiCheck size={18} />
                  </button>
                )}
                {reg.status !== 'rejected' && reg.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateRegistrationStatus(reg._id, 'rejected')}
                    disabled={loading}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-50 p-2 rounded transition disabled:opacity-50"
                    title="Reject registration"
                  >
                    <FiX size={18} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteRegistration(reg._id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition disabled:opacity-50"
                  title="Delete registration"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            {fields.length > 0 && (
              <dl className="mt-4 grid grid-cols-1 gap-3">
                {fields.map(field => (
                  <div key={field.id} className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-words">
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
        <div className="text-center py-12 text-gray-500">
          No registrations yet
        </div>
      )}
    </div>
  );
};
