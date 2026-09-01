import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';
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
    <div className="hackathon-leaderboard-page min-h-screen">
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
            <section className="leaderboard-hero">
              <div className="leaderboard-glow" aria-hidden="true" />
              <div className="leaderboard-orbits" aria-hidden="true" />
              <p className="leaderboard-pill">
                <FiTrendingUp /> Live leaderboard
              </p>
              <h1>{workshop?.title}</h1>
              <p>Rankings are calculated from review averages and published only after admin approval.</p>
            </section>

            {leaderboard.length > 0 && (
              <div className="leaderboard-podium">
                {leaderboard.slice(0, 3).map((registration, index) => (
                  <div key={registration._id} className={`podium-card rank-${index + 1}`}>
                    <div className="podium-rank">{index === 0 ? <FiAward /> : `#${index + 1}`}</div>
                    <p>{getTeamName(registration)}</p>
                    <strong>{registration.evaluationAverage}</strong>
                    <span>{registration.teamCode}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-4">
              {leaderboard.map((registration, index) => (
                <div
                  key={registration._id}
                  className="leaderboard-row"
                  style={{ '--score-width': `${Math.min(100, Math.max(0, Number(registration.evaluationAverage) || 0))}%` }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="leaderboard-rank">
                        {index === 0 ? <FiStar /> : `#${index + 1}`}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">{getTeamName(registration)}</h2>
                        <p className="text-sm font-bold tracking-widest text-slate-500">{registration.teamCode}</p>
                      </div>
                    </div>
                    <div className="leaderboard-score">
                      <p className="text-xs font-black uppercase tracking-wide text-primary">Average</p>
                      <p className="text-3xl font-black">{registration.evaluationAverage}</p>
                    </div>
                  </div>
                  <div className="leaderboard-score-bar" aria-hidden="true">
                    <span />
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
