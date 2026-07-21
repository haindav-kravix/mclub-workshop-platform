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

  useEffect(() => {
    entryAPI.getPass(registrationId)
      .then(response => setPass(response.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load entry pass'))
      .finally(() => setLoading(false));
  }, [registrationId]);

  const qrValue = useMemo(() => {
    if (!pass?.token) return '';
    return `${window.location.origin}/entry/verify?entryToken=${encodeURIComponent(pass.token)}`;
  }, [pass?.token]);

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

  return (
    <div className="entry-pass-page min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate('/my-registrations')} className="entry-back-button"><FiArrowLeft /> My Events</button>

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
              <strong>{pass.user?.name}</strong>
              <p>{pass.user?.email}</p>
              {pass.entry?.checkedInAt && (
                <p className="entry-entered-note">Entered at {new Date(pass.entry.checkedInAt).toLocaleString()}</p>
              )}
            </div>
          </section>

          <aside className="entry-qr-panel">
            <div className="entry-qr-frame">
              <img src={qrSrc} alt="Entry pass QR code" />
            </div>
            <p className="entry-pass-code">PASS CODE <strong>{pass.passCode}</strong></p>
            <button onClick={() => window.print()} className="entry-download-button"><FiDownload /> Download / Print Pass</button>
          </aside>
        </div>
      </div>
    </div>
  );
};
