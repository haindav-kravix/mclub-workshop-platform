import React, { useMemo, useState } from 'react';
import { FiCheck, FiEdit3, FiUploadCloud, FiX } from 'react-icons/fi';

export const RegistrationCorrectionModal = ({ registration, onClose, onSubmit }) => {
  const fields = useMemo(() => {
    const allowed = new Set(registration.editableFieldIds || []);
    return (registration.workshopId?.registrationFormFields || [])
      .filter(field => allowed.has(field.fieldId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [registration]);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(field => [field.fieldId, registration.formData?.[field.fieldId] || ''])));
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setValue = (fieldId, value) => setValues(previous => ({ ...previous, [fieldId]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = new FormData();
      const textValues = {};
      fields.forEach(field => {
        if (field.type === 'image' || field.type === 'file') {
          if (files[field.fieldId]) payload.append(field.fieldId, files[field.fieldId]);
        } else {
          textValues[field.fieldId] = values[field.fieldId] || '';
        }
      });
      payload.append('formData', JSON.stringify(textValues));
      await onSubmit(registration._id, payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to update registration');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="correction-title">
      <form onSubmit={submit} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700"><FiEdit3 /> Admin requested correction</p><h2 id="correction-title" className="mt-1 text-2xl font-black text-slate-950">Update registration details</h2><p className="mt-1 text-sm font-semibold text-slate-500">Only the fields opened by the admin are shown. Check carefully before submitting.</p></div>
          <button type="button" onClick={onClose} disabled={saving} className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600" aria-label="Close"><FiX /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}
          {fields.map(field => {
            const common = { required: field.required, value: values[field.fieldId] || '', onChange: event => setValue(field.fieldId, event.target.value), className: 'mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50' };
            return (
              <label key={field.fieldId} className="block text-sm font-black text-slate-800">
                {field.label}{field.required && <span className="text-rose-500"> *</span>}
                {['text', 'email', 'phone'].includes(field.type) && <input type={field.type === 'phone' ? 'tel' : field.type} {...common} />}
                {['textarea', 'question-text'].includes(field.type) && <textarea rows="4" {...common} />}
                {['select', 'radio', 'question-mcq'].includes(field.type) && (
                  <select {...common}><option value="">Select an option</option>{(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}</select>
                )}
                {field.type === 'checkbox' && (
                  <span className="mt-2 grid gap-2 sm:grid-cols-2">{(field.options || []).map(option => {
                    const selected = (values[field.fieldId] || '').split(',').filter(Boolean);
                    return <span key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 font-semibold"><input type="checkbox" checked={selected.includes(option)} onChange={event => setValue(field.fieldId, event.target.checked ? [...selected, option].join(',') : selected.filter(item => item !== option).join(','))} />{option}</span>;
                  })}</span>
                )}
                {['image', 'file'].includes(field.type) && (
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4"><FiUploadCloud className="text-blue-600" size={22} /><input type="file" required={field.required} accept={field.type === 'image' ? 'image/*,.heic,.heif' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt'} onChange={event => setFiles(previous => ({ ...previous, [field.fieldId]: event.target.files?.[0] || null }))} className="min-w-0 flex-1 text-sm font-semibold" /></span>
                )}
              </label>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 bg-white font-black text-slate-700">Cancel</button>
          <button type="submit" disabled={saving || !fields.length} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"><FiCheck /> {saving ? 'Updating...' : 'Submit Correction'}</button>
        </div>
      </form>
    </div>
  );
};
