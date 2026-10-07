import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiEye, FiEyeOff, FiSave, FiSearch, FiSend, FiUsers } from 'react-icons/fi';
import { FormBuilder } from '../components/FormBuilder';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

export const AdminHackathonFinalSubmissionPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ title: 'Final Submission', instructions: '', fields: [], enabled: false });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const response = await registrationAPI.getAdminFinalSubmission(workshopId);
      setData(response.data);
      const workshop = response.data.workshop;
      setForm({
        title: workshop.hackathonFinalSubmissionTitle || 'Final Submission',
        instructions: workshop.hackathonFinalSubmissionInstructions || '',
        fields: workshop.hackathonFinalSubmissionFields || [],
        enabled: Boolean(workshop.hackathonFinalSubmissionEnabled)
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load final submission settings');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [workshopId]);

  const teams = useMemo(() => (data?.teams || []).filter(team => {
    const matchesState = filter === 'all' || (filter === 'submitted' ? team.submittedAt : !team.submittedAt);
    const haystack = `${team.teamCode} ${(team.members || []).map(member => `${member.name} ${member.email}`).join(' ')}`.toLowerCase();
    return matchesState && haystack.includes(search.trim().toLowerCase());
  }), [data, filter, search]);
  const submitted = (data?.teams || []).filter(team => team.submittedAt).length;

  const save = async (enabled = form.enabled) => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const response = await registrationAPI.updateFinalSubmissionConfig(workshopId, { ...form, enabled });
      setForm(previous => ({ ...previous, enabled }));
      setData(previous => ({ ...previous, workshop: response.data.workshop }));
      setSuccess(response.data.message);
    } catch (err) { setError(err.response?.data?.message || 'Unable to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="min-h-screen app-shell px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => navigate('/admin/hackathons')} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-bold shadow"><FiArrowLeft /> Back to Hackathons</button>
        <section className="rounded-lg bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-widest text-emerald-400">Hackathon final hand-in</p><h1 className="mt-2 text-3xl font-black">{data?.workshop?.title}</h1><p className="mt-2 text-slate-300">Create the team form, control visibility, and track every submission.</p></div>
            <button onClick={() => save(!form.enabled)} disabled={saving} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 font-black transition ${form.enabled ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'}`}>{form.enabled ? <FiEyeOff /> : <FiEye />}{form.enabled ? 'Close Submissions' : 'Open Submissions'}</button>
          </div>
        </section>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <section className="panel rounded-lg p-5 sm:p-7">
            <h2 className="text-2xl font-black">Form settings</h2>
            <div className="mt-5 grid gap-4">
              <label className="font-bold">Button and form title<input value={form.title} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3" maxLength="160" /></label>
              <label className="font-bold">Instructions<textarea value={form.instructions} onChange={event => setForm(previous => ({ ...previous, instructions: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3" rows="4" maxLength="3000" placeholder="Tell teams exactly what they must submit." /></label>
              <FormBuilder key={`${workshopId}-${data?.workshop?.updatedAt || ''}`} title="Final Submission Form Builder" initialFields={form.fields} onFieldsChange={fields => setForm(previous => ({ ...previous, fields }))} />
              <button onClick={() => save()} disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700 disabled:opacity-60"><FiSave /> {saving ? 'Saving...' : 'Save Form & Settings'}</button>
            </div>
          </section>
          <section className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white p-4 shadow"><FiUsers className="text-emerald-600" /><p className="mt-2 text-2xl font-black">{data?.teams?.length || 0}</p><p className="text-xs font-bold text-slate-500">Confirmed</p></div>
              <div className="rounded-lg bg-emerald-50 p-4 shadow"><FiCheckCircle className="text-emerald-600" /><p className="mt-2 text-2xl font-black">{submitted}</p><p className="text-xs font-bold text-slate-500">Submitted</p></div>
              <div className="rounded-lg bg-amber-50 p-4 shadow"><FiClock className="text-amber-600" /><p className="mt-2 text-2xl font-black">{(data?.teams?.length || 0) - submitted}</p><p className="text-xs font-bold text-slate-500">Pending</p></div>
            </div>
            <div className="panel rounded-lg p-4">
              <div className="relative"><FiSearch className="absolute left-3 top-3.5 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search team or member" className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3" /></div>
              <div className="mt-3 grid grid-cols-3 gap-2">{['all', 'submitted', 'pending'].map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-sm font-black capitalize ${filter === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>{value}</button>)}</div>
              <div className="mt-4 max-h-[640px] space-y-3 overflow-auto">{teams.map(team => <div key={team.registrationId} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{team.teamCode}</p><p className="mt-1 text-xs text-slate-500">{(team.members || []).map(member => member.name).join(', ')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${team.submittedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{team.submittedAt ? 'Submitted' : 'Pending'}</span></div>{team.submittedAt && <p className="mt-2 text-xs font-semibold text-slate-500">{new Date(team.submittedAt).toLocaleString()}</p>}</div>)}{teams.length === 0 && <p className="py-8 text-center font-semibold text-slate-500">No teams match this view.</p>}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
