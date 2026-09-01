import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff, FiRefreshCw, FiSave, FiShield, FiTrendingUp } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

const ADMIN_CODE = 'KLHAZ';

const getTeamName = (registration) => {
  const formData = registration.formData || {};
  const priorityKeys = Object.keys(formData).filter(key => /team|project|group|name/i.test(key));
  const priorityValue = priorityKeys.map(key => formData[key]).find(value => String(value || '').trim().length > 1);
  const fallbackValue = Object.values(formData).find(value => String(value || '').trim().length > 1);
  return priorityValue || fallbackValue || registration.userId?.name || registration.userId?.email || 'Confirmed team';
};

export const AdminHackathonEvaluationPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [codeModal, setCodeModal] = useState({ open: false, registrationId: '', code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reviewCount = Math.min(20, Math.max(1, Number(workshop?.hackathonReviewCount) || 3));
  const rankedRegistrations = useMemo(() => [...registrations].sort((a, b) => (b.evaluationAverage || 0) - (a.evaluationAverage || 0)), [registrations]);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const response = await registrationAPI.getHackathonEvaluation(workshopId);
        setWorkshop(response.data.workshop);
        setRegistrations(response.data.registrations);
        const nextScores = {};
        response.data.registrations.forEach(registration => {
          nextScores[registration._id] = Array.from({ length: Number(response.data.workshop.hackathonReviewCount) || 3 }, (_, index) => registration.evaluationScores?.[index] ?? '');
        });
        setScores(nextScores);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load hackathon evaluation');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [workshopId]);

  const updateScore = (registrationId, index, value) => {
    setScores(prev => ({
      ...prev,
      [registrationId]: (prev[registrationId] || Array.from({ length: reviewCount }, () => '')).map((score, scoreIndex) => (
        scoreIndex === index ? value : score
      ))
    }));
  };

  const openCodeModal = (registrationId) => {
    setCodeModal({ open: true, registrationId, code: '' });
    setError('');
  };

  const saveScores = async () => {
    const { registrationId, code } = codeModal;
    if (code !== ADMIN_CODE) {
      setError('Wrong code. Marks were not changed.');
      return;
    }

    setSavingId(registrationId);
    setError('');
    try {
      const response = await registrationAPI.updateHackathonEvaluation(registrationId, scores[registrationId] || [], code);
      setRegistrations(prev => prev.map(registration => registration._id === registrationId ? response.data.registration : registration));
      setSuccess('Marks saved and leaderboard updated');
      setCodeModal({ open: false, registrationId: '', code: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSavingId('');
    }
  };

  const toggleLeaderboard = async () => {
    setError('');
    try {
      const response = await registrationAPI.toggleHackathonLeaderboard(workshopId, !workshop.hackathonLeaderboardVisible);
      setWorkshop(response.data.workshop);
      setSuccess(response.data.workshop.hackathonLeaderboardVisible ? 'Leaderboard is visible to confirmed teams' : 'Leaderboard is hidden');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update leaderboard visibility');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-secondary">Hackathon control room</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">{workshop?.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
                Add review marks for confirmed teams. Average scores update the leaderboard automatically.
              </p>
            </div>
            <button
              onClick={toggleLeaderboard}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-sm transition ${
                workshop?.hackathonLeaderboardVisible ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-primary text-secondary hover:bg-primary/80'
              }`}
            >
              {workshop?.hackathonLeaderboardVisible ? <FiEyeOff /> : <FiEye />}
              {workshop?.hackathonLeaderboardVisible ? 'Hide Leaderboard' : 'Show Leaderboard'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <FiShield className="text-3xl text-emerald-600" />
            <p className="mt-3 text-3xl font-black text-slate-950">{registrations.length}</p>
            <p className="text-sm font-bold text-slate-500">Confirmed teams</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <FiRefreshCw className="text-3xl text-violet-600" />
            <p className="mt-3 text-3xl font-black text-slate-950">{reviewCount}</p>
            <p className="text-sm font-bold text-slate-500">Reviews per team</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <FiTrendingUp className="text-3xl text-primary" />
            <p className="mt-3 text-3xl font-black">{rankedRegistrations[0]?.evaluationAverage || 0}</p>
            <p className="text-sm font-bold text-slate-300">Top average</p>
          </div>
        </div>

        <div className="grid gap-4">
          {rankedRegistrations.map((registration, index) => (
            <div key={registration._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid gap-4 lg:grid-cols-[72px_1fr_auto] lg:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-700">
                  #{index + 1}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-xl font-black text-slate-950">{getTeamName(registration)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Team code <span className="tracking-widest text-slate-950">{registration.teamCode || 'PENDING'}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950 px-5 py-3 text-center text-white">
                  <p className="text-xs font-black uppercase tracking-wide text-primary">Average</p>
                  <p className="text-3xl font-black">{registration.evaluationAverage || 0}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: reviewCount }, (_, scoreIndex) => (
                  <label key={scoreIndex} className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Review {scoreIndex + 1}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scores[registration._id]?.[scoreIndex] ?? ''}
                      onChange={event => updateScore(registration._id, scoreIndex, event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-black outline-none focus:border-emerald-400 focus:bg-white"
                      placeholder="0-100"
                    />
                  </label>
                ))}
                <button
                  onClick={() => openCodeModal(registration._id)}
                  disabled={savingId === registration._id}
                  className="flex h-12 items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 font-black text-secondary shadow-sm transition hover:bg-primary/80 disabled:opacity-60"
                >
                  <FiSave /> {savingId === registration._id ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
            </div>
          ))}

          {registrations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-lg font-bold text-slate-600">
              No confirmed teams yet.
            </div>
          )}
        </div>
      </div>

      {codeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700">
              <FiShield />
            </div>
            <h2 className="mt-5 text-center text-2xl font-black text-slate-950">Confirm Mark Change</h2>
            <p className="mt-2 text-center text-sm font-semibold text-slate-600">
              Enter admin code to save or update this team's review marks.
            </p>
            <input
              type="password"
              autoFocus
              value={codeModal.code}
              onChange={(event) => setCodeModal(prev => ({ ...prev, code: event.target.value.toUpperCase() }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveScores();
                if (event.key === 'Escape') setCodeModal({ open: false, registrationId: '', code: '' });
              }}
              className="mt-5 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-black tracking-[0.3em] text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
              placeholder="CODE"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCodeModal({ open: false, registrationId: '', code: '' })}
                className="h-12 rounded-xl border border-slate-200 bg-white font-black text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveScores}
                disabled={savingId === codeModal.registrationId}
                className="h-12 rounded-xl bg-primary font-black text-secondary shadow-sm transition hover:bg-primary/80 disabled:opacity-60"
              >
                {savingId === codeModal.registrationId ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
