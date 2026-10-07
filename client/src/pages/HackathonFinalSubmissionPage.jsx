import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiSend, FiUploadCloud } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

export const HackathonFinalSubmissionPage = () => {
  const { workshopId } = useParams();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try { const response = await registrationAPI.getTeamFinalSubmission(workshopId); setData(response.data); setValues(response.data.registration.formData || {}); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load final submission form'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [workshopId]);

  const submit = async event => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const payload = new FormData();
      payload.append('formData', JSON.stringify(values));
      Object.entries(files).forEach(([key, file]) => file && payload.append(key, file));
      const response = await registrationAPI.submitTeamFinalSubmission(workshopId, payload);
      setSuccess(response.data.message); await load();
    } catch (err) { setError(err.response?.data?.message || 'Unable to submit final details'); }
    finally { setSaving(false); }
  };
  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="min-h-screen app-shell p-6"><div className="mx-auto max-w-3xl"><ErrorMessage message={error || 'Form unavailable'} /><Link to="/my-registrations" className="mt-4 inline-flex items-center gap-2 font-bold"><FiArrowLeft /> My Events</Link></div></div>;
  const renderField = field => {
    const common = { id: field.fieldId, required: field.required, value: values[field.fieldId] || '', onChange: event => setValues(previous => ({ ...previous, [field.fieldId]: event.target.value })), className: 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' };
    if (field.type === 'textarea' || field.type === 'question-text') return <textarea {...common} rows="5" />;
    if (field.type === 'select') return <select {...common}><option value="">Select an option</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>;
    if (field.type === 'radio' || field.type === 'question-mcq') return <div className="mt-2 grid gap-2">{field.options.map(option => <label key={option} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold"><input type="radio" name={field.fieldId} value={option} checked={values[field.fieldId] === option} onChange={common.onChange} required={field.required} />{option}</label>)}</div>;
    if (field.type === 'checkbox') return <div className="mt-2 grid gap-2">{field.options.map(option => { const selected = String(values[field.fieldId] || '').split(', ').filter(Boolean); return <label key={option} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold"><input type="checkbox" checked={selected.includes(option)} onChange={event => setValues(previous => ({ ...previous, [field.fieldId]: (event.target.checked ? [...selected, option] : selected.filter(item => item !== option)).join(', ') }))} />{option}</label>; })}</div>;
    if (field.type === 'image' || field.type === 'file') return <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50 px-4 py-5 font-bold text-emerald-800"><FiUploadCloud size={22} /><span>{files[field.fieldId]?.name || (values[field.fieldId] ? 'Uploaded file saved. Choose to replace it.' : 'Choose file')}</span><input className="sr-only" type="file" accept={field.type === 'image' ? 'image/*' : undefined} required={field.required && !values[field.fieldId]} onChange={event => setFiles(previous => ({ ...previous, [field.fieldId]: event.target.files?.[0] }))} /></label>;
    return <input {...common} type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'} />;
  };
  return <div className="min-h-screen app-shell px-4 py-8"><div className="mx-auto max-w-3xl"><Link to="/my-registrations" className="mb-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-bold shadow"><FiArrowLeft /> My Events</Link><section className="rounded-lg bg-slate-950 p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-black uppercase tracking-widest text-emerald-400">{data.registration.teamCode}</p><h1 className="mt-2 text-3xl font-black">{data.workshop.formTitle}</h1><p className="mt-2 text-slate-300">{data.workshop.title}</p>{data.registration.submittedAt && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-black text-emerald-300"><FiCheckCircle /> Submitted {new Date(data.registration.submittedAt).toLocaleString()}</p>}</section>{error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}{success && <div className="mt-5"><SuccessMessage message={success} onDismiss={() => setSuccess('')} /></div>}<form onSubmit={submit} className="panel mt-6 rounded-lg p-5 sm:p-8">{data.workshop.instructions && <p className="mb-7 whitespace-pre-wrap rounded-lg bg-emerald-50 p-4 font-semibold leading-7 text-emerald-950">{data.workshop.instructions}</p>}<div className="space-y-6">{data.workshop.fields.map(field => <label key={field.fieldId} className="block font-black text-slate-900">{field.label}{field.required && <span className="text-rose-500"> *</span>}{renderField(field)}</label>)}</div><button disabled={saving || !data.workshop.enabled} className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"><FiSend /> {saving ? 'Submitting...' : data.registration.submittedAt ? 'Update Final Submission' : 'Submit Final Details'}</button>{!data.workshop.enabled && <p className="mt-3 text-center font-bold text-rose-600">Submissions are currently closed. Your saved submission is read-only.</p>}</form></div></div>;
};
