import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiTrendingUp } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { registrationAPI } from '../utils/api';

const getTeamName = (registration) => {
  const formData = registration.formData || {};
  const priorityKeys = Object.keys(formData).filter(key => /team|project|group|name/i.test(key));
  const priorityValue = priorityKeys.map(key => formData[key]).find(value => String(value || '').trim().length > 1);
  const fallbackValue = Object.values(formData).find(value => String(value || '').trim().length > 1);
  return priorityValue || fallbackValue || registration.userId?.name || 'Team';
};

export const HackathonLeaderboardPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await registrationAPI.getHackathonLeaderboard(workshopId);
        setWorkshop(response.data.workshop);
        setLeaderboard(response.data.leaderboard);
      } catch (err) {
        setError(err.response?.data?.message || 'Leaderboard is not available yet');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [workshopId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
        >
          <FiArrowLeft /> Back
        </button>

        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
              <div className="leaderboard-glow" aria-hidden="true" />
              <p className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-wide text-secondary">
                <FiTrendingUp /> Live leaderboard
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">{workshop?.title}</h1>
              <p className="mt-3 max-w-2xl text-base font-semibold text-slate-300">
                Rankings are calculated from admin review averages.
              </p>
            </section>

            <div className="mt-6 grid gap-4">
              {leaderboard.map((registration, index) => (
                <div
                  key={registration._id}
                  className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                    index === 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black ${
                        index === 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {index === 0 ? <FiAward /> : `#${index + 1}`}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">{getTeamName(registration)}</h2>
                        <p className="text-sm font-bold tracking-widest text-slate-500">{registration.teamCode}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-950 px-6 py-3 text-center text-white">
                      <p className="text-xs font-black uppercase tracking-wide text-primary">Average</p>
                      <p className="text-3xl font-black">{registration.evaluationAverage}</p>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-lg font-bold text-slate-600">
                  Scores are not published yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
