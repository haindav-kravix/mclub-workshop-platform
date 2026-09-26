import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiCheck, FiEye, FiEyeOff, FiMousePointer, FiPlus, FiRefreshCw, FiShuffle, FiUsers, FiTrash2 } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { workshopAPI } from '../utils/api';

export const AdminHackathonProblemStatementsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshopTitle, setWorkshopTitle] = useState('');
  const [statements, setStatements] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('self_select');
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatements = async () => {
    try {
      const response = await workshopAPI.getAdminProblemStatements(workshopId);
      setWorkshopTitle(response.data.title);
      setStatements(response.data.problemStatements || []);
      setAssignmentMode(response.data.assignmentMode || 'self_select');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load problem statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatements(); }, [workshopId]);

  const updateAssignmentMode = async (mode, reassign = false) => {
    if (mode === 'random' && !statements.some(statement => statement.isPublished)) {
      setError('Publish at least one problem statement before enabling random assignment');
      return;
    }
    if (mode !== assignmentMode) {
      const message = mode === 'random'
        ? 'Switch to random assignment? Existing selections will be replaced with balanced random assignments.'
        : 'Switch to team selection? Current automatic assignments will be cleared so teams can choose.';
      if (!window.confirm(message)) return;
    }
    if (reassign && !window.confirm('Randomly redistribute all confirmed teams across the published statements?')) return;

    setSavingMode(true);
    setError('');
    try {
      const response = await workshopAPI.setProblemStatementAssignmentMode(workshopId, mode, reassign);
      setAssignmentMode(response.data.assignmentMode);
      if (response.data.assignmentMode === 'random') {
        const count = response.data.assignedCount || 0;
        setSuccess(`${count} confirmed team${count === 1 ? '' : 's'} assigned across published statements`);
      } else {
        setSuccess('Teams can now select one published problem statement');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update assignment mode');
    } finally {
      setSavingMode(false);
    }
  };

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
      setSuccess(response.data.problemStatement.isPublished
        ? assignmentMode === 'random' ? 'Published and confirmed teams redistributed' : 'Problem statement published to confirmed teams'
        : assignmentMode === 'random' ? 'Moved to draft and affected teams reassigned' : 'Problem statement moved to draft');
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
          <button
            onClick={() => navigate(`/admin/hackathon/${workshopId}/problem-statements/selections`)}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-secondary shadow-lg transition hover:bg-primary/80"
          >
            <FiUsers /> Selection Overview
          </button>
        </div>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Assignment method</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">How teams receive a statement</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">Only published statements are available for selection or automatic assignment.</p>
            </div>
            {assignmentMode === 'random' && (
              <button
                type="button"
                onClick={() => updateAssignmentMode('random', true)}
                disabled={savingMode}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
              >
                <FiRefreshCw /> Redistribute All
              </button>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => updateAssignmentMode('self_select')}
              disabled={savingMode || assignmentMode === 'self_select'}
              className={`relative min-h-28 rounded-2xl border p-4 text-left transition disabled:cursor-default ${assignmentMode === 'self_select' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
            >
              <span className="flex items-center gap-2 text-lg font-black text-slate-950"><FiMousePointer className="text-emerald-700" /> Teams Choose</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">Each confirmed team selects one published statement and it becomes locked.</span>
              {assignmentMode === 'self_select' && <FiCheck className="absolute right-4 top-4 text-xl text-emerald-700" />}
            </button>
            <button
              type="button"
              onClick={() => updateAssignmentMode('random')}
              disabled={savingMode || assignmentMode === 'random'}
              className={`relative min-h-28 rounded-2xl border p-4 text-left transition disabled:cursor-default ${assignmentMode === 'random' ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200'}`}
            >
              <span className="flex items-center gap-2 text-lg font-black text-slate-950"><FiShuffle className="text-violet-700" /> Random Assignment</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">Confirmed teams are distributed fairly and randomly across published statements.</span>
              {assignmentMode === 'random' && <FiCheck className="absolute right-4 top-4 text-xl text-violet-700" />}
            </button>
          </div>
        </section>

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
