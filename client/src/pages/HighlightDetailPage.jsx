import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowUpRight, FiAward, FiCalendar, FiImage } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { achievementAPI, resolveMediaUrl } from '../utils/api';
import { formatHighlightDate, getHighlightCategory } from '../utils/highlights';

export const HighlightDetailPage = () => {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    achievementAPI.getPublished()
      .then(response => setHighlights(response.data || []))
      .catch(err => setError(err.response?.data?.message || 'Unable to load highlight'))
      .finally(() => setLoading(false));
  }, []);

  const highlight = useMemo(() => highlights.find(item => item._id === highlightId), [highlights, highlightId]);
  const related = useMemo(() => highlights.filter(item => item._id !== highlightId).slice(0, 3), [highlights, highlightId]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      </div>
    );
  }

  if (!highlight) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-lg border border-emerald-100 bg-white p-10 text-center">
          <FiAward className="mx-auto text-secondary" size={42} />
          <h1 className="mt-4 text-2xl font-black">Highlight not found</h1>
          <button onClick={() => navigate('/achievements')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-black text-slate-950">
            <FiArrowLeft /> Back to Highlights
          </button>
        </div>
      </div>
    );
  }

  const images = highlight.images || [];

  return (
    <div className="highlight-detail-page min-h-screen">
      <header className="highlight-detail-hero">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <button
            type="button"
            onClick={() => navigate('/achievements')}
            className="highlight-back-link"
          >
            <FiArrowLeft /> Club Highlights
          </button>
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="highlight-detail-cover">
              {images[0] ? (
                <img src={resolveMediaUrl(images[0], { w: 1400 })} alt={highlight.title} />
              ) : (
                <FiImage />
              )}
            </div>
            <div>
              <div className="highlight-card-meta">
                <span><FiAward /> {getHighlightCategory(highlight)}</span>
                <span><FiCalendar /> {formatHighlightDate(highlight.achievedOn)}</span>
              </div>
              <h1 className="highlight-detail-page-title">{highlight.title}</h1>
              <p className="highlight-detail-page-summary">{highlight.summary}</p>
              {highlight.links?.length > 0 && (
                <div className="highlight-detail-links">
                  {highlight.links.map(link => (
                    <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label} <FiArrowUpRight />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-secondary">Media</p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">All photos</h2>
            </div>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-secondary">{images.length || 0} photo{images.length === 1 ? '' : 's'}</p>
          </div>
          {images.length > 0 ? (
            <div className="highlight-detail-photo-grid">
              {images.map((image, index) => (
                <a key={image} href={resolveMediaUrl(image, { w: 1800 })} target="_blank" rel="noreferrer" className="highlight-detail-photo">
                  <img src={resolveMediaUrl(image, { w: 1000 })} alt={`${highlight.title} ${index + 1}`} />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-100 bg-white p-10 text-center text-slate-500">No photos uploaded for this highlight.</div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <p className="text-sm font-black uppercase tracking-wide text-secondary">More from the club</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Related highlights</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map(item => (
                <Link key={item._id} to={`/achievements/${item._id}`} className="highlight-related-card">
                  {item.images?.[0] ? <img src={resolveMediaUrl(item.images[0], { w: 700 })} alt={item.title} /> : <div><FiImage /></div>}
                  <span>{getHighlightCategory(item)}</span>
                  <h3>{item.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
