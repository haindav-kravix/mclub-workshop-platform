import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiEye, FiEyeOff, FiPlus, FiTrash2 } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { workshopAPI } from '../utils/api';

export const AdminHackathonProblemStatementsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshopTitle, setWorkshopTitle] = useState('');
  const [statements, setStatements] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatements = async () => {
    try {
      const response = await workshopAPI.getAdminProblemStatements(workshopId);
      setWorkshopTitle(response.data.title);
      setStatements(response.data.problemStatements || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load problem statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatements(); }, [workshopId]);

  const createStatement = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await workshopAPI.createProblemStatement(workshopId, form);
      setStatements(prev => [...prev, response.data.problemStatement]);
      setForm({ title: '', description: '' });
      setSuccess('Problem statement added as a draft');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add problem statement');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (statement) => {
    setError('');
    try {
      const response = await workshopAPI.setProblemStatementPublished(workshopId, statement._id, !statement.isPublished);
      setStatements(prev => prev.map(item => item._id === statement._id ? response.data.problemStatement : item));
      setSuccess(response.data.problemStatement.isPublished ? 'Problem statement published to confirmed teams' : 'Problem statement moved to draft');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update problem statement');
    }
  };

  const removeStatement = async (statement) => {
    if (!window.confirm(`Delete “${statement.title}”?`)) return;
    setError('');
    try {
      await workshopAPI.deleteProblemStatement(workshopId, statement._id);
      setStatements(prev => prev.filter(item => item._id !== statement._id));
      setSuccess('Problem statement deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete problem statement');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <button onClick={() => navigate('/admin/hackathons')} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-secondary shadow-sm hover:bg-emerald-50">
          <FiArrowLeft /> Back to Hackathons
        </button>
        <div className="mb-7 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-300"><FiBookOpen /> Problem statement desk</p>
          <h1 className="mt-3 break-words text-3xl font-black sm:text-5xl">{workshopTitle}</h1>
          <p className="mt-3 max-w-2xl font-semibold text-slate-300">Add statements as drafts, then publish each one when it is ready for confirmed teams.</p>
        </div>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <form onSubmit={createStatement} className="mb-8 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-2xl font-black text-slate-950">Add problem statement</h2>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Title</span>
              <input value={form.title} maxLength={180} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} className="h-14 w-full rounded-xl border border-slate-200 px-4 font-bold outline-none focus:border-emerald-400" placeholder="Example: Smart campus resource planner" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Full problem statement</span>
              <textarea value={form.description} maxLength={5000} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} className="min-h-40 w-full rounded-xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-emerald-400" placeholder="Describe the challenge, expected outcome, and constraints." />
            </label>
            <button disabled={saving || !form.title.trim() || !form.description.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-secondary shadow-sm disabled:opacity-50 sm:justify-self-start">
              <FiPlus /> {saving ? 'Adding...' : 'Add as Draft'}
            </button>
          </div>
        </form>

        <div className="grid gap-4">
          {statements.map((statement, index) => (
            <article key={statement._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Statement {index + 1}</p>
                  <h2 className="mt-1 break-words text-xl font-black text-slate-950">{statement.title}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">{statement.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statement.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{statement.isPublished ? 'Published' : 'Draft'}</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button onClick={() => togglePublished(statement)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl font-black ${statement.isPublished ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-primary text-secondary hover:bg-primary/80'}`}>
                  {statement.isPublished ? <FiEyeOff /> : <FiEye />} {statement.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => removeStatement(statement)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 font-black text-rose-700 hover:bg-rose-100"><FiTrash2 /> Delete</button>
              </div>
            </article>
          ))}
          {statements.length === 0 && <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center font-bold text-slate-500">No problem statements added yet.</div>}
        </div>
      </div>
    </div>
  );
};
