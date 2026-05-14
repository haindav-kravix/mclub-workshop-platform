import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiAward, FiBriefcase, FiCalendar } from 'react-icons/fi';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen app-shell">
      {/* Hero Section */}
      <div className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-secondary mb-6">
              <FiCalendar /> Live workshops and technical sessions
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              MongoDB Technical Club
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl">
              Discover practical workshops, register in seconds, and build stronger database skills with a focused technical community.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8 max-w-2xl">
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="font-bold text-white">MongoDB Global Certification Guidance</p>
                <p className="text-sm text-slate-300 mt-1">We help members prepare for globally recognized MongoDB certifications.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="font-bold text-white">Opportunity Pathways</p>
                <p className="text-sm text-slate-300 mt-1">Registered workshop students may be considered for internships and community opportunities.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <Link
                to="/workshops"
                className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-slate-950 rounded-lg font-bold hover:bg-primary/80 transition"
              >
                <span>Browse Workshops</span>
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
                className="inline-flex items-center justify-center px-8 py-3 border border-white/20 text-white rounded-lg font-bold hover:bg-white/10 transition"
              >
                View Events
              </Link>
            </div>
          </div>

          <div className="panel rounded-lg p-5 bg-white text-slate-950">
            <div className="rounded-lg bg-slate-950 text-white p-6 mb-4">
              <p className="text-sm text-secondary font-semibold mb-2">Community focus</p>
              <h2 className="text-2xl font-bold">Learn, certify, and grow through hands-on workshop participation.</h2>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg bg-slate-50 soft-border p-4 flex gap-3">
                <FiAward className="text-primary text-2xl flex-none" />
                <div>
                  <p className="font-bold text-slate-950">Certification Guidance</p>
                  <p className="text-sm text-slate-600">Guidance for students preparing for MongoDB global certifications.</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 soft-border p-4 flex gap-3">
                <FiBriefcase className="text-primary text-2xl flex-none" />
                <div>
                  <p className="font-bold text-slate-950">Student Opportunities</p>
                  <p className="text-sm text-slate-600">Workshop participation may help students become eligible for future internship opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary font-bold mb-2">What you get</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Built for practical learning</h2>
            </div>
            <p className="text-slate-600 max-w-xl">Every session is organized around real skills, clear registration, and a simple event experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="panel rounded-lg p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                <FiCalendar className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Regular Events</h3>
              <p className="text-gray-600">
                Attend workshops and events hosted by MongoDB experts and community members
              </p>
            </div>

            {/* Feature 2 */}
            <div className="panel rounded-lg p-6">
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center mb-5">
                <FiAward className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Certification Guidance</h3>
              <p className="text-gray-600">
                Get guidance for MongoDB global certification preparation
              </p>
            </div>

            {/* Feature 3 */}
            <div className="panel rounded-lg p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-5">
                <FiBriefcase className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Opportunities</h3>
              <p className="text-gray-600">
                Registered workshop students may be considered for internships and future programs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Club Section */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">About MongoDB Technical Club</h2>
              <p className="text-gray-600 mb-4">
                We are a community-driven organization dedicated to learning, sharing, and advancing knowledge about MongoDB and modern NoSQL databases.
              </p>
              <p className="text-gray-600 mb-4">
                Through our workshops, meetups, and collaborative projects, we help developers:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
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
            </div>
            <div className="bg-slate-950 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">For Registered Students</h3>
              <div className="space-y-4 text-slate-200">
                <p>Access workshop-specific Telegram groups after registration.</p>
                <p>Receive updates from admins about session schedules, resources, and opportunities.</p>
                <p>Stay connected with the community while preparing for certification and career growth.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
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
        </div>
      </div>
    </div>
  );
};
