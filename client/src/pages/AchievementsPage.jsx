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
      .finally(() => setTimeout(() => setLoading(false), 650));
  }, []);

  if (loading) {
    return (
      <div className="achievement-loader min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="achievement-loader-icon mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-secondary"><FiAward size={38} /></div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Loading club achievements</h1>
          <p className="mt-2 text-slate-500">Gathering our newest milestones...</p>
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
