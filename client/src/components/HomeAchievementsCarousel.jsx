import React, { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AchievementCard } from './AchievementCard';

export const HomeAchievementsCarousel = ({ achievements }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef(null);
  const count = achievements.length;
  const isControlTarget = (target) => target.closest?.('button, a, input, textarea, select, [role="button"]');

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
        if (isControlTarget(event.target)) return;
        pointerStart.current = event.clientX;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setPaused(true);
      }}
      onPointerUp={(event) => {
        if (isControlTarget(event.target)) return;
        if (pointerStart.current !== null) {
          const distance = event.clientX - pointerStart.current;
          if (Math.abs(distance) > 45) distance > 0 ? previous() : next();
        }
        pointerStart.current = null;
        window.setTimeout(() => setPaused(false), 1200);
      }}
      onPointerCancel={() => { pointerStart.current = null; setPaused(false); }}
      aria-roledescription="carousel"
      aria-label="MongoDB Technical Club achievements"
    >
      <div className={`achievement-carousel-slide achievement-carousel-slide-${direction}`} key={`${active._id}-${activeIndex}`}>
        <AchievementCard achievement={active} featured />
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 sm:justify-end">
            <button type="button" onClick={previous} className="achievement-carousel-arrow" title="Previous achievement" aria-label="Previous achievement"><FiChevronLeft size={22} /></button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose achievement">
              {achievements.map((achievement, index) => (
                <button
                  key={achievement._id}
                  type="button"
                  onClick={() => moveTo(index, index >= activeIndex ? 'next' : 'previous')}
                  className={`achievement-carousel-dot ${index === activeIndex ? 'achievement-carousel-dot-active' : ''}`}
                  aria-label={`Show achievement ${index + 1}`}
                  aria-selected={index === activeIndex}
                  role="tab"
                />
              ))}
            </div>
            <button type="button" onClick={next} className="achievement-carousel-arrow" title="Next achievement" aria-label="Next achievement"><FiChevronRight size={22} /></button>
        </div>
      )}
    </div>
  );
};
