import React from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiInstagram, FiLinkedin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/klh_mongodb_techclub',
    icon: FiInstagram
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mongodb-tech-club',
    icon: FiLinkedin
  }
];

export const Footer = () => {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="border-t border-emerald-100 bg-white px-4 py-4 pb-20 sm:pb-5">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 text-center">
        {isAuthenticated && (
          <Link to="/achievements" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary">
            <FiAward /> MongoDB Technical Club Achievements
          </Link>
        )}
        <p className="text-xs font-semibold text-slate-600 sm:text-sm">
          © MongoDB Technical Club. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-700 sm:text-sm">Get updates on</span>
          {SOCIAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-slate-900 transition hover:border-primary hover:bg-primary/10 sm:text-sm"
              >
                <Icon />
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
