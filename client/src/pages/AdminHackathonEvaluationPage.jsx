import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiDownload, FiEdit3, FiEye, FiEyeOff, FiRefreshCw, FiSearch, FiShield } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

const getTeamName = (registration) => {
  return registration.teamCode || 'Confirmed team';
};

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const AdminHackathonEvaluationPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reviewCount = Math.min(20, Math.max(1, Number(workshop?.hackathonReviewCount) || 3));
  const visibleRegistrations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter(registration => (
      getTeamName(registration).toLowerCase().includes(query) ||
      String(registration.teamCode || '').toLowerCase().includes(query)
    ));
  }, [registrations, searchTerm]);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const response = await registrationAPI.getHackathonEvaluation(workshopId);
        setWorkshop(response.data.workshop);
        setRegistrations(response.data.registrations);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load hackathon evaluation');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [workshopId]);

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

  const exportEvaluation = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await registrationAPI.exportHackathonEvaluation(workshopId);
      const safeName = String(workshop?.title || 'hackathon')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      downloadBlob(response.data, `${safeName || 'hackathon'}-evaluation.xlsx`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export evaluation');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7">
          <button
            onClick={() => navigate('/admin/hackathons')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> Back to Hackathons
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-secondary">Hackathon evaluation</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">{workshop?.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
                Select a team to evaluate review by review. Reviews must be completed in order.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                onClick={() => navigate(`/hackathon/${workshopId}/leaderboard`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-secondary shadow-sm transition hover:bg-emerald-50"
              >
                <FiBarChart2 /> View Leaderboard
              </button>
              <button
                onClick={exportEvaluation}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-secondary shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
              >
                <FiDownload /> {exporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={toggleLeaderboard}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black shadow-sm transition ${
                  workshop?.hackathonLeaderboardVisible ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-primary text-secondary hover:bg-primary/80'
                }`}
              >
                {workshop?.hackathonLeaderboardVisible ? <FiEyeOff /> : <FiEye />}
                {workshop?.hackathonLeaderboardVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="mb-5 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
          <label className="flex items-center gap-3">
            <FiSearch className="text-emerald-700" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              placeholder="Search team name"
            />
          </label>
        </div>

        <div className="grid gap-4">
          {visibleRegistrations.map((registration) => (
            <div key={registration._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="break-words text-xl font-black text-slate-950">{getTeamName(registration)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {registration.selectedProblemStatement?.title || 'Problem statement not selected'}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/hackathon/${workshopId}/evaluation/${registration._id}`)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-black text-secondary shadow-sm transition hover:bg-primary/80"
                >
                  <FiEdit3 /> Evaluate
                </button>
              </div>
            </div>
          ))}

          {registrations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-lg font-bold text-slate-600">
              No confirmed teams yet.
            </div>
          )}
          {registrations.length > 0 && visibleRegistrations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-lg font-bold text-slate-600">
              No team found for this search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
