import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiBarChart2, FiCheckCircle, FiClock, FiTrendingUp, FiUsers, FiXCircle } from 'react-icons/fi';
import { ErrorMessage } from '../components/UI';
import { workshopAPI } from '../utils/api';

const getTotal = (workshop) => workshop.totalRegistrationCount ?? workshop.registrationStats?.total ?? workshop.registrationCount ?? 0;
const getConfirmed = (workshop) => workshop.confirmedRegistrationCount ?? workshop.registrationStats?.confirmed ?? workshop.registrationCount ?? 0;
const getRejected = (workshop) => workshop.rejectedRegistrationCount ?? workshop.registrationStats?.rejected ?? 0;

export const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await workshopAPI.getAdminWorkshops();
        if (mounted) setWorkshops(response.data || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        window.setTimeout(() => {
          if (mounted) setLoading(false);
        }, 1350);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const analytics = useMemo(() => {
    const totalRegistrations = workshops.reduce((sum, item) => sum + getTotal(item), 0);
    const confirmed = workshops.reduce((sum, item) => sum + getConfirmed(item), 0);
    const rejected = workshops.reduce((sum, item) => sum + getRejected(item), 0);
    const running = workshops.filter(item => !item.isStopped).length;
    const open = workshops.filter(item => item.registrationsOpen !== false).length;
    const confirmationRate = totalRegistrations ? Math.round((confirmed / totalRegistrations) * 100) : 0;
    const rejectionRate = totalRegistrations ? Math.round((rejected / totalRegistrations) * 100) : 0;
    const rankedEvents = [...workshops]
      .sort((a, b) => getTotal(b) - getTotal(a))
      .slice(0, 6);

    return { totalRegistrations, confirmed, rejected, running, open, confirmationRate, rejectionRate, rankedEvents };
  }, [workshops]);

  if (loading) {
    return (
      <div className="analytics-loader">
        <div className="analytics-loader-grid" />
        <div className="analytics-loader-scan" />
        <div className="analytics-loader-orbit orbit-a" />
        <div className="analytics-loader-orbit orbit-b" />
        <div className="analytics-loader-core">
          <div className="analytics-loader-ring" />
          <div className="analytics-loader-ring ring-inner" />
          <FiBarChart2 />
        </div>
        <h1><span>Building</span> <span>analytics</span> <span>dashboard</span></h1>
        <p>Scanning registrations, confirmations, event status, and growth signals</p>
        <div className="analytics-loader-dashboard" aria-hidden="true">
          <span /><span /><span />
          <i /><i /><i /><i />
        </div>
        <div className="analytics-loader-bars">
          <span /><span /><span /><span /><span />
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total registrations', value: analytics.totalRegistrations, icon: FiUsers, tone: 'emerald' },
    { label: 'Confirmed students', value: analytics.confirmed, icon: FiCheckCircle, tone: 'green' },
    { label: 'Rejected', value: analytics.rejected, icon: FiXCircle, tone: 'rose' },
    { label: 'Running events', value: analytics.running, icon: FiActivity, tone: 'slate' }
  ];
  const healthItems = [
    { label: 'Accepting registrations', value: analytics.open, tone: 'good' },
    { label: 'Visible/running events', value: analytics.running, tone: 'good' },
    { label: 'Rejection rate', value: `${analytics.rejectionRate}%`, tone: analytics.rejectionRate > 30 ? 'warn' : 'good' }
  ];

  return (
    <div className="analytics-page min-h-screen">
      <header className="analytics-hero">
        <div className="analytics-hero-grid" aria-hidden="true" />
        <div className="analytics-hero-beam beam-one" aria-hidden="true" />
        <div className="analytics-hero-beam beam-two" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <button onClick={() => navigate('/admin')} className="analytics-back">
            <FiArrowLeft /> Admin Dashboard
          </button>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="admin-kicker"><FiTrendingUp /> Advanced analytics</div>
              <h1>Club performance intelligence</h1>
              <p>Track registration demand, student confirmation flow, active operations, and event performance from one dedicated analytics view.</p>
            </div>
            <div className="analytics-score-card">
              <span className="analytics-score-orbit" aria-hidden="true" />
              <p>Confirmation rate</p>
              <strong>{analytics.confirmationRate}%</strong>
              <div><span style={{ width: `${analytics.confirmationRate}%` }} /></div>
              <small>{analytics.confirmed} confirmed from {analytics.totalRegistrations} registrations</small>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        <section className="analytics-metric-grid">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className={`analytics-metric-card ${metric.tone}`} style={{ '--analytics-delay': `${index * 90}ms` }}>
                <Icon />
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
              </div>
            );
          })}
        </section>

        <section className="analytics-board mt-8">
          <div className="analytics-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Event ranking</p>
                <h2>Top registrations</h2>
              </div>
              <FiBarChart2 className="text-emerald-600" size={26} />
            </div>
            <div className="mt-6 space-y-4">
              {analytics.rankedEvents.length === 0 && <p className="font-bold text-slate-500">No events available yet.</p>}
              {analytics.rankedEvents.map((event, index) => {
                const total = getTotal(event);
                const percent = analytics.totalRegistrations ? Math.max(8, Math.round((total / analytics.totalRegistrations) * 100)) : 8;
                return (
                  <div key={event._id} className="analytics-rank-row">
                    <div>
                      <span>#{index + 1}</span>
                      <p>{event.title}</p>
                    </div>
                    <strong>{total}</strong>
                    <div><span style={{ width: `${percent}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Operational health</p>
                <h2>Status overview</h2>
              </div>
              <FiClock className="text-emerald-600" size={26} />
            </div>
            <div className="analytics-ring-wrap">
              <div className="analytics-ring" style={{ '--rate': `${analytics.confirmationRate * 3.6}deg` }}>
                <span>{analytics.confirmationRate}%</span>
              </div>
              <div className="analytics-ring-copy">
                {healthItems.map(item => (
                  <p key={item.label} className={item.tone}><strong>{item.value}</strong> {item.label}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-live-grid mt-8">
          <div className="analytics-trend-card wide">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Live event signal</p>
              <h2>Registration momentum</h2>
            </div>
            <div className="analytics-wave" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span />
            </div>
            <p>Highest demand is coming from the top ranked events. Use this section to quickly decide where approval, attendance, and email actions need attention.</p>
          </div>
          <div className="analytics-trend-card">
            <FiCheckCircle />
            <strong>{analytics.confirmationRate}%</strong>
            <span>Approval quality</span>
          </div>
          <div className="analytics-trend-card">
            <FiUsers />
            <strong>{workshops.length}</strong>
            <span>Total events tracked</span>
          </div>
        </section>
      </main>
    </div>
  );
};
