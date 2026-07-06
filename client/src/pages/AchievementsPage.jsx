import React, { useEffect, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import { achievementAPI } from '../utils/api';
import { AchievementCard } from '../components/AchievementCard';
import { ErrorMessage } from '../components/UI';

export const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    achievementAPI.getPublished()
      .then(response => setAchievements(response.data || []))
      .catch(err => setError(err.response?.data?.message || 'Unable to load achievements'))
      .finally(() => setTimeout(() => setLoading(false), 1650));
  }, []);

  if (loading) {
    return (
      <div className="achievement-loader-stage fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950 px-5 text-white">
        <div className="achievement-loader-grid" aria-hidden="true" />
        <div className="achievement-loader-track achievement-loader-track-one" aria-hidden="true" />
        <div className="achievement-loader-track achievement-loader-track-two" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-xl text-center">
          <div className="achievement-loader-kicker">MongoDB Technical Club</div>
          <div className="achievement-loader-emblem mx-auto mt-7 flex h-24 w-24 items-center justify-center border border-emerald-400 text-emerald-300">
            <FiAward size={46} />
            <span className="achievement-loader-corner achievement-loader-corner-one" />
            <span className="achievement-loader-corner achievement-loader-corner-two" />
          </div>
          <h1 className="achievement-loader-title mt-8 text-3xl font-black sm:text-5xl">
            <span>Loading</span> <span>club</span> <span>achievements</span>
          </h1>
          <p className="achievement-loader-copy mt-4 text-sm font-bold uppercase text-slate-400">Preparing our newest milestones</p>
          <div className="achievement-loader-progress mx-auto mt-8 h-1 w-full max-w-sm overflow-hidden bg-slate-800"><span /></div>
          <div className="achievement-loader-count mt-3 text-xs font-black text-emerald-300">DISCOVER • CELEBRATE • INSPIRE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-secondary"><FiAward size={25} /></div>
          <p className="mt-6 text-sm font-black uppercase tracking-wide text-secondary">MongoDB Technical Club</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-6xl">Our achievements</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Milestones, recognitions, partnerships, and student successes. Newest achievements appear first.</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {!error && achievements.length === 0 && (
          <div className="rounded-lg border border-emerald-100 bg-white p-12 text-center">
            <FiAward className="mx-auto text-secondary" size={42} />
            <h2 className="mt-4 text-2xl font-black">Achievements are being prepared</h2>
            <p className="mt-2 text-slate-500">New club milestones will appear here.</p>
          </div>
        )}
        {achievements.map((achievement, index) => (
          <AchievementCard key={achievement._id} achievement={achievement} featured={index === 0} />
        ))}
      </main>
    </div>
  );
};
