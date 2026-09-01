import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiMapPin } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';
import { formatWorkshopTime } from '../utils/formatters';
import { getEventLabel } from '../utils/eventLabels';

export const HomeEventsCarousel = ({ events }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [paused, setPaused] = useState(false);
  const count = events.length;

  const moveTo = (nextIndex, nextDirection = 'next') => {
    if (!count) return;
    setDirection(nextDirection);
    setActiveIndex((nextIndex + count) % count);
  };

  const previous = () => moveTo(activeIndex - 1, 'previous');
  const next = () => moveTo(activeIndex + 1, 'next');

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const timer = window.setInterval(() => {
      setDirection('next');
      setActiveIndex(index => (index + 1) % count);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  useEffect(() => {
    if (activeIndex >= count) setActiveIndex(0);
  }, [activeIndex, count]);

  if (!count) return null;

  const event = events[activeIndex];
  const eventLabel = getEventLabel(event);
  const eventTime = formatWorkshopTime(event);

  return (
    <div className="home-event-carousel" aria-roledescription="carousel" aria-label="Current club events">
      <Link
        to={`/workshop/${event._id}`}
        className={`home-event-carousel-slide achievement-carousel-slide-${direction} block focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300`}
        key={`${event._id}-${activeIndex}`}
        aria-label={`Open event: ${event.title}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="home-upcoming-card home-solid-card grid h-full overflow-hidden rounded-lg text-slate-950 shadow-lg transition hover:-translate-y-1 hover:border-primary hover:shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative h-56 overflow-hidden bg-emerald-50 sm:h-72 lg:h-full">
            {event.coverImage ? (
              <img
                src={event.coverImagePreview || resolveMediaUrl(event.coverImage, { w: 1100 })}
                alt={event.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="home-upcoming-image h-full w-full object-contain p-3 sm:p-5"
                onError={(imageEvent) => {
                  imageEvent.currentTarget.onerror = null;
                  imageEvent.currentTarget.src = '/brand/klh-head-banner.png';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-4xl font-black text-primary">
                {event.title?.charAt(0) || 'E'}
              </div>
            )}
            <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
              {eventLabel} Registrations {event.registrationsOpen !== false ? 'Open' : 'Closed'}
            </div>
          </div>
          <div className="flex min-h-0 flex-col justify-center p-5 sm:p-8">
            <h3 className="line-clamp-2 break-words text-2xl font-black leading-tight sm:text-4xl">{event.title}</h3>
            <p className="mt-4 line-clamp-3 text-base leading-7 text-slate-600">{event.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <FiCalendar className="mb-2 text-primary" />
                <p className="text-sm font-bold">{new Date(event.startDate || event.date).toLocaleDateString()}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <FiClock className="mb-2 text-primary" />
                <p className="text-sm font-bold">{eventTime || event.duration}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <FiMapPin className="mb-2 text-primary" />
                <p className="truncate text-sm font-bold">{event.venue}</p>
              </div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 font-black text-primary">
              View Details <FiArrowRight />
            </div>
          </div>
        </div>
      </Link>

      {count > 1 && (
        <div className="achievement-carousel-controls mt-5 flex items-center justify-center gap-3 sm:justify-end">
          <button type="button" onClick={previous} className="achievement-carousel-arrow" title="Previous event" aria-label="Previous event"><FiChevronLeft size={22} /></button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose event">
            {events.map((item, index) => (
              <button
                key={item._id}
                type="button"
                onClick={() => moveTo(index, index >= activeIndex ? 'next' : 'previous')}
                className={`achievement-carousel-dot ${index === activeIndex ? 'achievement-carousel-dot-active' : ''}`}
                aria-label={`Show event ${index + 1}`}
                aria-selected={index === activeIndex}
                role="tab"
              />
            ))}
          </div>
          <button type="button" onClick={next} className="achievement-carousel-arrow" title="Next event" aria-label="Next event"><FiChevronRight size={22} /></button>
        </div>
      )}
    </div>
  );
};
