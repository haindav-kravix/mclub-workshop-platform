import React from 'react';
import { createPortal } from 'react-dom';
import { FiMail } from 'react-icons/fi';

const GUIDANCE_EMAIL = 'mongodbclub@klh.edu.in';
const GUIDANCE_SUBJECT = 'MongoDB Club Guidance';
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(GUIDANCE_EMAIL)}&su=${encodeURIComponent(GUIDANCE_SUBJECT)}`;
const GMAIL_APP_URL = `googlegmail://co?to=${encodeURIComponent(GUIDANCE_EMAIL)}&subject=${encodeURIComponent(GUIDANCE_SUBJECT)}`;

const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

export const SupportMailButton = () => {
  const handleGuidanceClick = (event) => {
    if (!isMobileDevice()) return;

    event.preventDefault();
    window.location.href = GMAIL_APP_URL;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = GMAIL_COMPOSE_URL;
      }
    }, 900);
  };

  const button = (
    <a
      href={GMAIL_COMPOSE_URL}
      target="_blank"
      rel="noreferrer"
      onClick={handleGuidanceClick}
      className="guidance-fab"
      aria-label="Email guidance"
      title="Email guidance"
    >
      <FiMail size={17} />
    </a>
  );

  return createPortal(button, document.body);
};
