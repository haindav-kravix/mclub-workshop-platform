import React from 'react';
import { FiMail } from 'react-icons/fi';

const GUIDANCE_EMAIL = 'mongodb.tc@gmail.com';

export const SupportMailButton = () => {
  return (
    <a
      href={`mailto:${GUIDANCE_EMAIL}?subject=MongoDB%20Club%20Guidance`}
      className="fixed bottom-5 left-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-slate-950 shadow-xl transition hover:bg-primary/80 sm:w-auto sm:px-5 sm:gap-2"
      aria-label="Email guidance"
      title="Email guidance"
    >
      <FiMail size={22} />
      <span className="hidden font-bold sm:inline">Guidance</span>
    </a>
  );
};
