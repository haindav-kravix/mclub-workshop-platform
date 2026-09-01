import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiLock, FiSave, FiShield } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

const ADMIN_CODE = 'KLHAZ';

const getTeamName = (registration) => {
  return registration.teamCode || 'Confirmed team';
};

const reviewComplete = (review) => Number(review?.score) > 0 && Boolean(String(review?.reason || '').trim());
const hasPostedMarks = (registration) => Boolean(
  registration?.evaluationReviews?.some(reviewComplete)
);

export const AdminHackathonTeamEvaluationPage = () => {
  const { workshopId, registrationId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codeModal, setCodeModal] = useState({ open: false, code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reviewCount = Math.min(20, Math.max(1, Number(workshop?.hackathonReviewCount) || 3));
  const reviewMaxScores = Array.from({ length: reviewCount }, (_, index) => (
    Math.min(1000, Math.max(1, Number(workshop?.hackathonReviewMaxScores?.[index]) || 100))
  ));
  const nextOpenIndex = useMemo(() => {
    const index = reviews.findIndex(review => !reviewComplete(review));
    return index === -1 ? reviews.length : index;
  }, [reviews]);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await registrationAPI.getHackathonEvaluation(workshopId);
        const foundRegistration = response.data.registrations.find(item => item._id === registrationId);
        if (!foundRegistration) {
          setError('Team was not found in confirmed registrations');
          return;
        }

        setWorkshop(response.data.workshop);
        setRegistration(foundRegistration);
        setReviews(Array.from({ length: Number(response.data.workshop.hackathonReviewCount) || 3 }, (_, index) => ({
          score: foundRegistration.evaluationReviews?.[index]?.score || foundRegistration.evaluationScores?.[index] || '',
          reason: foundRegistration.evaluationReviews?.[index]?.reason || '',
          evaluatorName: foundRegistration.evaluationReviews?.[index]?.evaluatorName || foundRegistration.evaluationReviews?.[index]?.evaluator?.name || ''
        })));
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load team evaluation');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [workshopId, registrationId]);

  const updateReview = (index, updates) => {
    setReviews(prev => prev.map((review, reviewIndex) => (
      reviewIndex === index ? { ...review, ...updates } : review
    )));
  };

  const persistReviews = async (code = '') => {
    if (code && code !== ADMIN_CODE) {
      setError('Wrong code. Marks were not changed.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await registrationAPI.updateHackathonEvaluation(registrationId, reviews, code);
      const updated = response.data.registration;
      setRegistration(updated);
      setReviews(Array.from({ length: reviewCount }, (_, index) => ({
        score: updated.evaluationReviews?.[index]?.score || updated.evaluationScores?.[index] || '',
        reason: updated.evaluationReviews?.[index]?.reason || '',
        evaluatorName: updated.evaluationReviews?.[index]?.evaluatorName || updated.evaluationReviews?.[index]?.evaluator?.name || ''
      })));
      setCodeModal({ open: false, code: '' });
      setSuccess('Evaluation saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (hasPostedMarks(registration)) {
      setCodeModal({ open: true, code: '' });
      return;
    }
    persistReviews();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:py-7">
          <button
            onClick={() => navigate(`/admin/hackathon/${workshopId}/evaluation`)}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> Back to Teams
          </button>
          <p className="text-xs font-black uppercase tracking-wide text-secondary">Team evaluation</p>
          <h1 className="mt-2 break-words text-3xl font-black text-slate-950 sm:text-5xl">
            {registration ? getTeamName(registration) : 'Team'}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div>
            <div>
              <p className="text-lg font-black text-slate-950">Review order</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Complete Review 1 first, then Review 2, and continue in order.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {Array.from({ length: reviewCount }, (_, index) => {
            const review = reviews[index] || { score: '', reason: '' };
            const locked = index > nextOpenIndex;
            const readyToPost = reviewComplete(review);
            const postedReview = registration?.evaluationReviews?.[index];
            const posted = reviewComplete(postedReview);

            return (
              <section
                key={index}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                  locked ? 'border-slate-200 opacity-60' : posted ? 'border-emerald-200 shadow-emerald-100' : 'border-emerald-100'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                      locked ? 'bg-slate-100 text-slate-500' : posted ? 'bg-emerald-50 text-emerald-700' : 'bg-primary text-secondary'
                    }`}>
                      {locked ? <FiLock /> : posted ? <FiCheckCircle /> : index + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-950">Review {index + 1}</h2>
                      <p className="text-sm font-bold text-slate-500">
                        {locked ? `Complete Review ${nextOpenIndex + 1} first` : posted ? 'Completed' : readyToPost ? 'Ready to post' : `Maximum ${reviewMaxScores[index]} marks`}
                      </p>
                    </div>
                  </div>
                  {posted && review.evaluatorName && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      By {review.evaluatorName}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Marks</span>
                    <input
                      type="number"
                      min="0"
                      max={reviewMaxScores[index]}
                      value={review.score}
                      disabled={locked}
                      onChange={event => updateReview(index, { score: event.target.value })}
                      className="h-14 w-full rounded-xl border border-slate-200 bg-white px-3 text-lg font-black outline-none transition focus:border-emerald-400 disabled:bg-slate-100"
                      placeholder={`0-${reviewMaxScores[index]}`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Why this mark?</span>
                    <textarea
                      value={review.reason}
                      disabled={locked}
                      onChange={event => updateReview(index, { reason: event.target.value })}
                      className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 disabled:bg-slate-100"
                      placeholder="Write the evaluator note for this review"
                    />
                  </label>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <button
            onClick={handleSave}
            disabled={saving || !registration}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-secondary shadow-lg shadow-emerald-200/60 transition hover:bg-primary/80 disabled:opacity-60"
          >
            <FiSave /> {saving ? 'Saving...' : hasPostedMarks(registration) ? 'Update Marks' : 'Post Marks'}
          </button>
          {hasPostedMarks(registration) && (
            <p className="mt-3 text-center text-xs font-bold text-slate-500">
              Updating posted marks requires the admin code.
            </p>
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
              Enter admin code to update this team's review marks.
            </p>
            <input
              type="password"
              autoFocus
              value={codeModal.code}
              onChange={(event) => setCodeModal(prev => ({ ...prev, code: event.target.value.toUpperCase() }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') persistReviews(codeModal.code);
                if (event.key === 'Escape') setCodeModal({ open: false, code: '' });
              }}
              className="mt-5 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-black tracking-[0.3em] text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
              placeholder="CODE"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCodeModal({ open: false, code: '' })}
                className="h-12 rounded-xl border border-slate-200 bg-white font-black text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => persistReviews(codeModal.code)}
                disabled={saving}
                className="h-12 rounded-xl bg-primary font-black text-secondary shadow-sm transition hover:bg-primary/80 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Update Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
