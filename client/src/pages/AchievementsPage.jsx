import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiArrowUpRight, FiAward, FiCalendar, FiImage, FiX } from 'react-icons/fi';
import { achievementAPI, resolveMediaUrl } from '../utils/api';
import { ErrorMessage } from '../components/UI';

const CATEGORY_RULES = [
  { label: 'Workshops', terms: ['workshop', 'session', 'bootcamp', 'training'] },
  { label: 'Internships', terms: ['internship', 'intern', 'placement'] },
  { label: 'Certifications', terms: ['certificate', 'certification', 'certified'] },
  { label: 'Events', terms: ['event', 'meetup', 'launch', 'orientation'] },
  { label: 'Community', terms: ['community', 'student', 'team', 'club'] },
  { label: 'Media', terms: ['media', 'poster', 'photo', 'gallery'] }
];

const getHighlightCategory = (achievement) => {
  const text = `${achievement.title || ''} ${achievement.summary || ''}`.toLowerCase();
  return CATEGORY_RULES.find(category => category.terms.some(term => text.includes(term)))?.label || 'Highlights';
};

const formatHighlightDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

export const AchievementsPage = () => {
  const location = useLocation();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    achievementAPI.getPublished()
      .then(response => setAchievements(response.data || []))
      .catch(err => setError(err.response?.data?.message || 'Unable to load achievements'))
      .finally(() => setTimeout(() => setLoading(false), 1650));
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const highlightedId = new URLSearchParams(location.search).get('highlight');
    if (!highlightedId) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(`highlight-${highlightedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [loading, location.search, achievements.length]);

  useEffect(() => {
    if (!selectedHighlight) return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [selectedHighlight]);

  const highlightedId = new URLSearchParams(location.search).get('highlight');
  const categories = useMemo(() => {
    const found = new Set(achievements.map(getHighlightCategory));
    return ['All', ...CATEGORY_RULES.map(category => category.label).filter(label => found.has(label)), ...(found.has('Highlights') ? ['Highlights'] : [])];
  }, [achievements]);

  const filteredHighlights = useMemo(() => {
    return achievements.filter(item => {
      const category = getHighlightCategory(item);
      return activeCategory === 'All' || category === activeCategory;
    });
  }, [achievements, activeCategory]);

  const featuredHighlight = filteredHighlights[0];
  const remainingHighlights = featuredHighlight ? filteredHighlights.slice(1) : filteredHighlights;
  const openHighlight = (highlight, imageIndex = 0) => {
    setSelectedHighlight(highlight);
    setSelectedImageIndex(imageIndex);
  };

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
            <span>Loading</span> <span>club</span> <span>highlights</span>
          </h1>
          <p className="achievement-loader-copy mt-4 text-sm font-bold uppercase text-slate-400">Preparing our newest milestones</p>
          <div className="achievement-loader-progress mx-auto mt-8 h-1 w-full max-w-sm overflow-hidden bg-slate-800"><span /></div>
          <div className="achievement-loader-count mt-3 text-xs font-black text-emerald-300">DISCOVER • CELEBRATE • INSPIRE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="highlights-page min-h-screen">
      <header className="highlights-hero">
        <div className="highlights-orbit orbit-one" aria-hidden="true" />
        <div className="highlights-orbit orbit-two" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <div className="highlights-hero-badge">
            <FiAward />
            <span>MongoDB Technical Club</span>
          </div>
          <h1 className="highlights-hero-title mt-6">Club highlights</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">A public media wall for milestones, student stories, activities, recognitions, and club moments. Newest highlights appear first.</p>

          <div className="highlights-toolbar mt-8">
            <div className="highlights-categories" aria-label="Filter highlights">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? 'active' : ''}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {!error && achievements.length === 0 && (
          <div className="rounded-lg border border-emerald-100 bg-white p-12 text-center">
            <FiAward className="mx-auto text-secondary" size={42} />
            <h2 className="mt-4 text-2xl font-black">Highlights are being prepared</h2>
            <p className="mt-2 text-slate-500">New club milestones will appear here.</p>
          </div>
        )}
        {!error && achievements.length > 0 && filteredHighlights.length === 0 && (
          <div className="rounded-lg border border-emerald-100 bg-white p-12 text-center">
            <FiAward className="mx-auto text-secondary" size={42} />
            <h2 className="mt-4 text-2xl font-black">No highlights found</h2>
            <p className="mt-2 text-slate-500">Try another category.</p>
          </div>
        )}

        {featuredHighlight && (
          <section
            id={`highlight-${featuredHighlight._id}`}
            className={`highlight-featured-card ${highlightedId === featuredHighlight._id ? 'achievement-target-highlight' : ''}`}
          >
            <button type="button" onClick={() => openHighlight(featuredHighlight)} className="highlight-featured-media" aria-label={`Open ${featuredHighlight.title}`}>
              {featuredHighlight.images?.[0] ? (
                <img src={resolveMediaUrl(featuredHighlight.images[0])} alt={featuredHighlight.title} />
              ) : (
                <div className="highlight-empty-media"><FiImage /></div>
              )}
            </button>
            <div className="highlight-featured-copy">
              <div className="highlight-card-meta">
                <span><FiAward /> {getHighlightCategory(featuredHighlight)}</span>
                <span><FiCalendar /> {formatHighlightDate(featuredHighlight.achievedOn)}</span>
              </div>
              <h2>{featuredHighlight.title}</h2>
              <p>{featuredHighlight.summary}</p>
              <div className="highlight-action-row">
                <button type="button" onClick={() => openHighlight(featuredHighlight)} className="highlight-read-more">
                  View all photos <FiImage />
                </button>
                {featuredHighlight.links?.map(link => (
                  <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="highlight-redirect-link">
                    {link.label} <FiArrowUpRight />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {remainingHighlights.length > 0 && (
          <section className="highlights-wall mt-8">
            {remainingHighlights.map((achievement, index) => (
              <article
                key={achievement._id}
                id={`highlight-${achievement._id}`}
                className={`highlight-wall-card ${highlightedId === achievement._id ? 'achievement-target-highlight' : ''}`}
                style={{ '--highlight-delay': `${Math.min(index * 70, 420)}ms` }}
              >
                <button type="button" onClick={() => openHighlight(achievement)} className="highlight-wall-media" aria-label={`Open ${achievement.title}`}>
                  {achievement.images?.[0] ? (
                    <img src={resolveMediaUrl(achievement.images[0])} alt={achievement.title} />
                  ) : (
                    <div className="highlight-empty-media"><FiImage /></div>
                  )}
                  {achievement.images?.length > 1 && <span className="highlight-image-count">+{achievement.images.length - 1}</span>}
                </button>
                <div className="highlight-wall-copy">
                  <div className="highlight-card-meta compact">
                    <span>{getHighlightCategory(achievement)}</span>
                    <span>{formatHighlightDate(achievement.achievedOn)}</span>
                  </div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.summary}</p>
                  <div className="highlight-card-actions">
                    <button type="button" onClick={() => openHighlight(achievement)}>View photos</button>
                    {achievement.links?.slice(0, 2).map(link => (
                      <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                        {link.label} <FiArrowUpRight />
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {selectedHighlight && (
        <div
          className="highlight-detail-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={selectedHighlight.title}
        >
          <div className="highlight-detail-card">
            <button type="button" onClick={() => setSelectedHighlight(null)} className="highlight-detail-close" aria-label="Close highlight"><FiX /></button>
            <div className="highlight-detail-gallery">
              <div className="highlight-detail-main-image">
                {selectedHighlight.images?.[selectedImageIndex] ? (
                  <img src={resolveMediaUrl(selectedHighlight.images[selectedImageIndex])} alt={`${selectedHighlight.title} ${selectedImageIndex + 1}`} />
                ) : (
                  <FiImage />
                )}
              </div>
              <div className="highlight-detail-thumbnails" aria-label="All photos">
                {(selectedHighlight.images?.length ? selectedHighlight.images : [null]).map((image, index) => (
                  <button
                    key={image || 'empty'}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={index === selectedImageIndex ? 'active' : ''}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    {image ? <img src={resolveMediaUrl(image)} alt={`${selectedHighlight.title} thumbnail ${index + 1}`} /> : <FiImage />}
                  </button>
                ))}
              </div>
            </div>
            <div className="highlight-detail-copy">
              <div className="highlight-card-meta">
                <span><FiAward /> {getHighlightCategory(selectedHighlight)}</span>
                <span><FiCalendar /> {formatHighlightDate(selectedHighlight.achievedOn)}</span>
              </div>
              <h2>{selectedHighlight.title}</h2>
              <p>{selectedHighlight.summary}</p>
              {selectedHighlight.links?.length > 0 && (
                <div className="highlight-detail-links">
                  {selectedHighlight.links.map(link => (
                    <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label} <FiArrowUpRight />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
