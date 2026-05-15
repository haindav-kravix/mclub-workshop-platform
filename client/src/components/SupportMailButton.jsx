import React from 'react';
import { FiMail } from 'react-icons/fi';

const GUIDANCE_EMAIL = 'mongodb.tc@gmail.com';
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${GUIDANCE_EMAIL}&su=MongoDB%20Club%20Guidance`;

export const SupportMailButton = () => {
  return (
    <a
      href={GMAIL_COMPOSE_URL}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 left-4 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-slate-950 shadow-xl transition hover:bg-primary/80 sm:w-auto sm:px-4 sm:gap-2"
      aria-label="Email guidance"
      title="Email guidance"
    >
      <FiMail size={18} />
      <span className="hidden text-sm font-bold sm:inline">Guidance</span>
    </a>
  );
};
