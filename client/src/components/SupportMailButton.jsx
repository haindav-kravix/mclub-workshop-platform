import React from 'react';
import { FiMail } from 'react-icons/fi';

const SUPPORT_EMAIL = 'mongodb.tc@gmail.com';

export const SupportMailButton = () => {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=MongoDB%20Club%20Support`}
      className="fixed bottom-5 left-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-slate-950 shadow-xl transition hover:bg-primary/80 sm:w-auto sm:px-5 sm:gap-2"
      aria-label="Email support"
      title="Email support"
    >
      <FiMail size={22} />
      <span className="hidden font-bold sm:inline">Support</span>
    </a>
  );
};
