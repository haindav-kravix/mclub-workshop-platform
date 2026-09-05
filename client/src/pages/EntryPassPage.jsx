import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiMapPin, FiShield } from 'react-icons/fi';
import { entryAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { formatWorkshopTime } from '../utils/formatters';

export const EntryPassPage = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPass, setSelectedPass] = useState(0);

  useEffect(() => {
    entryAPI.getPass(registrationId)
      .then(response => setPass(response.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load entry pass'))
      .finally(() => setLoading(false));
  }, [registrationId]);

  const qrValue = useMemo(() => {
    const token = pass?.passes?.[selectedPass]?.token || pass?.token;
    if (!token) return '';
    return `${window.location.origin}/entry/verify?entryToken=${encodeURIComponent(token)}`;
  }, [pass?.token, pass?.passes, selectedPass]);

  const qrSrc = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&data=${encodeURIComponent(qrValue)}`
    : '';

  if (loading) return <LoadingSpinner />;

  if (error || !pass) {
    return (
      <div className="entry-pass-page min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => navigate('/my-registrations')} className="entry-back-button"><FiArrowLeft /> My Events</button>
          <div className="mt-5">{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}</div>
        </div>
      </div>
    );
  }

  const workshop = pass.workshop || {};
  const activePass = pass.passes?.[selectedPass] || pass;

  return (
    <div className="entry-pass-page min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate('/my-registrations')} className="entry-back-button"><FiArrowLeft /> My Events</button>

        {pass.passes?.length > 0 && (
          <div className="mt-6 rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
            <p className="px-2 text-xs font-black uppercase text-secondary">Four individual entry passes</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{pass.passes.map((memberPass, index) => <button key={memberPass.user._id} onClick={() => setSelectedPass(index)} className={`rounded-lg border p-3 text-left transition ${selectedPass === index ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}><p className="truncate font-black">{memberPass.user.name}</p><p className="mt-1 font-mono text-sm font-black text-secondary">PIN {memberPass.pin}</p></button>)}</div>
          </div>
        )}

        <div className="entry-pass-card mt-6">
          <div className="entry-pass-orbit" aria-hidden="true" />
          <section className="entry-pass-copy">
            <div className="entry-pass-kicker"><FiShield /> Entry QR Pass</div>
            <h1>{workshop.title}</h1>
            <p>Show this pass at the event entry desk. This is only for entry verification and does not mark attendance.</p>

            <div className="entry-pass-details">
              <div><FiCheckCircle /><span>Status</span><strong>Confirmed</strong></div>
              <div><FiCalendar /><span>Date</span><strong>{new Date(workshop.startDate || workshop.date).toLocaleDateString()}</strong></div>
              {formatWorkshopTime(workshop) && <div><FiClock /><span>Time</span><strong>{formatWorkshopTime(workshop)}</strong></div>}
              <div><FiMapPin /><span>Venue</span><strong>{workshop.venue}</strong></div>
            </div>

            <div className="entry-holder-card">
              <span>Pass holder</span>
              <strong>{activePass.user?.name}</strong>
              <p>{activePass.user?.email}</p>
              {activePass.pin && <p className="mt-2 font-mono font-black">INDIVIDUAL PIN {activePass.pin}</p>}
              {activePass.entry?.checkedInAt && (
                <p className="entry-entered-note">Entered at {new Date(activePass.entry.checkedInAt).toLocaleString()}</p>
              )}
            </div>
          </section>

          <aside className="entry-qr-panel">
            <div className="entry-qr-frame">
              <img src={qrSrc} alt="Entry pass QR code" />
            </div>
            <p className="entry-pass-code">PASS CODE <strong>{activePass.passCode}</strong></p>
            <button onClick={() => window.print()} className="entry-download-button"><FiDownload /> Download / Print Pass</button>
          </aside>
        </div>
      </div>
    </div>
  );
};
