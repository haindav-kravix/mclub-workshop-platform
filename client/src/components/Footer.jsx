import React from 'react';
import { FiInstagram, FiLinkedin } from 'react-icons/fi';

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
  return (
    <footer className="border-t border-emerald-100 bg-white px-4 py-5 pb-20 sm:pb-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-sm font-semibold text-slate-600">
          MongoDB Technical Club. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-bold text-slate-700">Get updates on</span>
          {SOCIAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-slate-900 transition hover:border-primary hover:bg-primary/10"
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
