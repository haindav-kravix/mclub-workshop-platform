import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { achievementAPI, workshopAPI, resolveMediaUrl } from '../utils/api';
import { formatWorkshopTime } from '../utils/formatters';
import { FiArrowRight, FiAward, FiBriefcase, FiCalendar, FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import { getEventLabel } from '../utils/eventLabels';
import { HomeAchievementsCarousel } from '../components/HomeAchievementsCarousel';
import { ScrollReveal } from '../components/ScrollReveal';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadWorkshops = async () => {
      try {
        const response = await workshopAPI.getAllWorkshops();
        if (mounted) setWorkshops(response.data || []);
      } catch {
        if (mounted) setWorkshops([]);
      } finally {
        if (mounted) setWorkshopsLoading(false);
      }
    };

    loadWorkshops();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    achievementAPI.getPublished()
      .then(response => { if (mounted) setAchievements((response.data || []).slice(0, 3)); })
      .catch(() => { if (mounted) setAchievements([]); })
      .finally(() => { if (mounted) setAchievementsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const featuredWorkshop = workshops[0];
  const featuredLabel = getEventLabel(featuredWorkshop);

  return (
    <div className="home-motion min-h-screen app-shell">
      {(achievementsLoading || achievements.length > 0) && (
        <section className="home-achievements-prime py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <ScrollReveal className="mb-6">
              <div className="home-club-welcome">
                <span className="home-club-welcome-line" />
                <span className="home-club-welcome-badge">
                  <FiAward />
                </span>
                <div>
                  <p className="home-club-welcome-kicker">Welcome to</p>
                  <h2>MongoDB Club</h2>
                  <p className="home-club-welcome-copy">Learn, build, celebrate achievements, and grow with a focused technical community.</p>
                </div>
                <span className="home-club-welcome-spark spark-one" />
                <span className="home-club-welcome-spark spark-two" />
              </div>
            </ScrollReveal>
            <ScrollReveal className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-secondary">Club Achievements</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">Latest highlights from MongoDB Technical Club</h1>
                <p className="mt-3 max-w-2xl text-slate-600">Explore recent recognitions, activities, and student milestones from the club.</p>
              </div>
              <Link to="/achievements" className="home-outline-action inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-black text-secondary">View All <FiArrowRight /></Link>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <div className="home-achievement-stage rounded-lg p-3 sm:p-5">
                {achievementsLoading ? (
                  <div className="home-achievement-skeleton rounded-lg">
                    <div className="home-skeleton-media" />
                    <div className="home-skeleton-copy">
                      <div className="home-skeleton-pill" />
                      <div className="home-skeleton-title" />
                      <div className="home-skeleton-line" />
                      <div className="home-skeleton-line short" />
                    </div>
                  </div>
                ) : (
                  <HomeAchievementsCarousel achievements={achievements} />
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <div className="home-official-hero">
        <div className="home-hero-stage max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-14 grid lg:grid-cols-[1.08fr_0.92fr] gap-6 sm:gap-10 items-center">
          <div className="home-hero-copy">
            <div className="home-eyebrow inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-secondary mb-5">
              <FiCalendar /> Student learning hub
            </div>
            <h1 className="home-hero-title text-4xl min-[380px]:text-5xl sm:text-6xl font-black mb-6 leading-none">
              Build database skills with MongoDB Technical Club
            </h1>
            <p className="home-hero-subtitle text-lg sm:text-xl mb-8 max-w-2xl leading-8">
              A focused student community for hands-on workshops, guided learning, technical achievements, and career-ready MongoDB practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <Link
                to="/workshops"
                className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-slate-950 rounded-lg font-bold hover:bg-primary/80 transition"
              >
                <span>Browse Events</span>
                <FiArrowRight />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-slate-950 rounded-lg font-bold hover:bg-primary/80 transition"
                >
                  <span>Get Started</span>
                  <FiArrowRight />
                </Link>
              </>
            )}
              <Link
                to="/workshops"
                className="home-secondary-action inline-flex items-center justify-center px-8 py-3 rounded-lg font-bold transition"
              >
                View Events
              </Link>
            </div>
          </div>

          <div className="home-hero-panel home-featured-panel rounded-lg p-5 text-slate-950">
            <div className="home-panel-main rounded-lg p-6 mb-4">
              <p className="text-sm text-secondary font-black uppercase tracking-wide mb-2">Club learning path</p>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">Learn by attending. Grow by building. Share through achievements.</h2>
            </div>
            <div className="grid gap-3">
              <div className="home-mini-card rounded-lg p-4 flex gap-3">
                <FiAward className="text-primary text-2xl flex-none" />
                <div>
                  <p className="font-bold text-slate-950">Certification Guidance</p>
                  <p className="text-sm text-slate-600">Structured guidance for students preparing for MongoDB certifications.</p>
                </div>
              </div>
              <div className="home-mini-card rounded-lg p-4 flex gap-3">
                <FiUsers className="text-primary text-2xl flex-none" />
                <div>
                  <p className="font-bold text-slate-950">Community Practice</p>
                  <p className="text-sm text-slate-600">Workshops, blogs, attendance, and certificates in one student-friendly hub.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Event Section */}
      {(workshopsLoading || featuredWorkshop) && (
        <div className="home-section-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <ScrollReveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <div className="home-happening-kicker">
                  <FiCalendar />
                  <span>Registrations</span>
                </div>
                <h2 className="home-happening-title mt-3">
                  <span>What's</span>
                  <span>happening</span>
                </h2>
                <p className="mt-3 max-w-2xl text-slate-600">Explore the latest {featuredLabel?.toLowerCase?.() || 'session'}, register quickly, and check your status from My Events.</p>
              </div>
              <Link
                to="/workshops"
                className="home-outline-action inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-bold transition"
              >
                View All <FiArrowRight />
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={110}>
            {workshopsLoading ? (
              <div className="home-upcoming-card grid overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
                <div className="h-56 animate-pulse bg-emerald-50 sm:h-72" />
                <div className="space-y-4 p-5 sm:p-8">
                  <div className="h-7 w-2/3 animate-pulse rounded bg-emerald-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="h-14 animate-pulse rounded-lg bg-emerald-50" />
                    <div className="h-14 animate-pulse rounded-lg bg-emerald-50" />
                    <div className="h-14 animate-pulse rounded-lg bg-emerald-50" />
                  </div>
                </div>
              </div>
            ) : (
              featuredWorkshop && (
                <Link
                  to={`/workshop/${featuredWorkshop._id}`}
                  className="home-upcoming-card home-solid-card grid overflow-hidden rounded-lg text-slate-950 shadow-lg transition hover:-translate-y-1 hover:border-primary hover:shadow-2xl lg:grid-cols-[0.95fr_1.05fr]"
                >
                  <div className="relative h-56 overflow-hidden bg-emerald-50 sm:h-72 lg:h-auto">
                    {featuredWorkshop.coverImage ? (
                      <img
                        src={resolveMediaUrl(featuredWorkshop.coverImage)}
                        alt={featuredWorkshop.title}
                        className="home-upcoming-image h-full w-full object-contain p-3 sm:p-5"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/brand/klh-head-banner.png';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-4xl font-black text-primary">
                        {featuredWorkshop.title?.charAt(0) || 'W'}
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                      {featuredLabel} Registrations {featuredWorkshop.registrationsOpen !== false ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-5 sm:p-8">
                    <h3 className="text-2xl font-black leading-tight sm:text-4xl break-words">{featuredWorkshop.title}</h3>
                    <p className="mt-4 line-clamp-3 text-base leading-7 text-slate-600">{featuredWorkshop.description}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                        <FiCalendar className="mb-2 text-primary" />
                        <p className="text-sm font-bold">{new Date(featuredWorkshop.startDate || featuredWorkshop.date).toLocaleDateString()}</p>
                      </div>
                      {formatWorkshopTime(featuredWorkshop) ? (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                          <FiClock className="mb-2 text-primary" />
                          <p className="text-sm font-bold">{formatWorkshopTime(featuredWorkshop)}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                          <FiClock className="mb-2 text-primary" />
                          <p className="text-sm font-bold">{featuredWorkshop.duration}</p>
                        </div>
                      )}
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                        <FiMapPin className="mb-2 text-primary" />
                        <p className="truncate text-sm font-bold">{featuredWorkshop.venue}</p>
                      </div>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 font-black text-primary">
                      View Details <FiArrowRight />
                    </div>
                  </div>
                </Link>
              )
            )}
            </ScrollReveal>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="home-section-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary font-bold mb-2">What you get</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Built for practical learning</h2>
            </div>
            <p className="text-slate-600 max-w-xl">Every session is organized around real skills, clear registration, and a simple event experience.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <ScrollReveal className="home-solid-card rounded-lg p-6" delay={40}>
              <div className="home-feature-icon w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                <FiCalendar className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Regular Events</h3>
              <p className="text-gray-600">
                Attend workshops and events hosted by MongoDB experts and community members
              </p>
            </ScrollReveal>

            {/* Feature 2 */}
            <ScrollReveal className="home-solid-card rounded-lg p-6" delay={130}>
              <div className="home-feature-icon w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center mb-5">
                <FiAward className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Certification Guidance</h3>
              <p className="text-gray-600">
                Get guidance for MongoDB global certification preparation
              </p>
            </ScrollReveal>

            {/* Feature 3 */}
            <ScrollReveal className="home-solid-card rounded-lg p-6" delay={220}>
              <div className="home-feature-icon w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-5">
                <FiBriefcase className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Opportunities</h3>
              <p className="text-gray-600">
                Registered workshop students may be considered for internships and future programs
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* About Club Section */}
      <div className="home-section-soft py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-4">About MongoDB Technical Club</h2>
              <p className="text-gray-600 mb-4">
                We are a community-driven organization dedicated to learning, sharing, and advancing knowledge about MongoDB and modern NoSQL databases.
              </p>
              <p className="text-gray-600 mb-4">
                Through our workshops, meetups, and guided learning activities, we help developers:
              </p>
              <ul className="home-about-list space-y-2 text-gray-600 mb-6">
                <li>✓ Master MongoDB concepts and best practices</li>
                <li>✓ Build scalable database architectures</li>
                <li>✓ Network with industry professionals</li>
                <li>✓ Stay updated with MongoDB releases</li>
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-950 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                >
                  <span>Join Our Club</span>
                  <FiArrowRight />
                </Link>
              )}
            </ScrollReveal>
            <ScrollReveal className="home-dark-card rounded-lg p-8 text-white" delay={150}>
              <h3 className="text-2xl font-bold mb-4">For Registered Students</h3>
              <div className="space-y-4 text-slate-200">
                <p>Access workshop-specific Telegram groups after registration.</p>
                <p>Receive updates about session schedules, resources, and opportunities.</p>
                <p>Stay connected with the community while preparing for certification and career growth.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="home-section-white border-t border-slate-200 py-12">
        <ScrollReveal className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-950">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-6">
            Register now to discover our upcoming workshops and start your MongoDB journey
          </p>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-slate-950 text-white rounded-lg font-bold hover:bg-slate-800 transition"
            >
              <span>Sign Up Now</span>
              <FiArrowRight />
            </Link>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
};
