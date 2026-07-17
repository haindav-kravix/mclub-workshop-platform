import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AchievementCard } from './AchievementCard';

export const HomeAchievementsCarousel = ({ achievements }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef(null);
  const swiped = useRef(false);
  const count = achievements.length;

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
  const active = achievements[activeIndex];

  return (
    <div
      className="achievement-carousel"
      onPointerDown={(event) => {
        if (event.target.closest?.('.achievement-carousel-controls')) return;
        pointerStart.current = event.clientX;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setPaused(true);
      }}
      onPointerUp={(event) => {
        if (event.target.closest?.('.achievement-carousel-controls')) return;
        if (pointerStart.current !== null) {
          const distance = event.clientX - pointerStart.current;
          if (Math.abs(distance) > 45) {
            swiped.current = true;
            distance > 0 ? previous() : next();
          }
        }
        pointerStart.current = null;
        window.setTimeout(() => setPaused(false), 1200);
      }}
      onPointerCancel={() => { pointerStart.current = null; setPaused(false); }}
      aria-roledescription="carousel"
      aria-label="MongoDB Technical Club highlights"
    >
      <Link
        to={`/achievements?highlight=${active._id}`}
        className={`achievement-carousel-slide achievement-carousel-slide-${direction} block focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300`}
        key={`${active._id}-${activeIndex}`}
        aria-label={`Open highlight: ${active.title}`}
        onClick={(event) => {
          if (!swiped.current) return;
          event.preventDefault();
          window.setTimeout(() => { swiped.current = false; }, 80);
        }}
      >
        <AchievementCard achievement={active} featured showLinks={false} />
      </Link>

      {count > 1 && (
        <div className="achievement-carousel-controls mt-5 flex items-center justify-center gap-3 sm:justify-end">
            <button type="button" onClick={previous} className="achievement-carousel-arrow" title="Previous highlight" aria-label="Previous highlight"><FiChevronLeft size={22} /></button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose highlight">
              {achievements.map((achievement, index) => (
                <button
                  key={achievement._id}
                  type="button"
                  onClick={() => moveTo(index, index >= activeIndex ? 'next' : 'previous')}
                  className={`achievement-carousel-dot ${index === activeIndex ? 'achievement-carousel-dot-active' : ''}`}
                  aria-label={`Show highlight ${index + 1}`}
                  aria-selected={index === activeIndex}
                  role="tab"
                />
              ))}
            </div>
            <button type="button" onClick={next} className="achievement-carousel-arrow" title="Next highlight" aria-label="Next highlight"><FiChevronRight size={22} /></button>
        </div>
      )}
    </div>
  );
};
