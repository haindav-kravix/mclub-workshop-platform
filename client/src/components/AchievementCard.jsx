import React, { useEffect, useRef, useState } from 'react';
import { FiArrowUpRight, FiAward, FiCalendar } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';

export const AchievementCard = ({ achievement, featured = false, showLinks = true }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -40px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const images = achievement.images || [];

  return (
    <article
      ref={ref}
      className={`achievement-card ${visible ? 'achievement-card-visible' : ''} overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm`}
    >
      <div className={`grid ${featured ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''}`}>
        <div className={`grid min-h-52 gap-1 bg-emerald-50 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.length ? images.slice(0, featured ? 4 : 2).map((image, index) => (
            <div key={image} className={`relative flex items-center justify-center overflow-hidden bg-white ${index === 0 && images.length === 3 ? 'row-span-2' : ''}`}>
              <img src={resolveMediaUrl(image)} alt={`${achievement.title} ${index + 1}`} className="h-full min-h-52 w-full object-contain p-2" loading="lazy" />
              {index === 1 && images.length > 2 && !featured && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-black text-white">+{images.length - 2}</div>
              )}
            </div>
          )) : (
            <div className="flex min-h-52 items-center justify-center text-secondary"><FiAward size={52} /></div>
          )}
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-700">
              <FiAward /> Club Highlight
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              <FiCalendar /> {new Date(achievement.achievedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className={`${featured ? 'text-3xl sm:text-4xl' : 'text-2xl'} font-black leading-tight text-slate-950`}>{achievement.title}</h2>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600">{achievement.summary}</p>
          {showLinks && achievement.links?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {achievement.links.map(link => (
                <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-50">
                  {link.label} <FiArrowUpRight />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
