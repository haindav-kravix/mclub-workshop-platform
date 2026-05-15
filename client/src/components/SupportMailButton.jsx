import React from 'react';
import { FiMail } from 'react-icons/fi';

const GUIDANCE_EMAIL = 'mongodbclub@klh.edu.in';
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${GUIDANCE_EMAIL}&su=MongoDB%20Club%20Guidance`;

export const SupportMailButton = () => {
  return (
    <a
      href={GMAIL_COMPOSE_URL}
      target="_blank"
      rel="noreferrer"
      className="guidance-fab"
      aria-label="Email guidance"
      title="Email guidance"
    >
      <FiMail size={17} />
    </a>
  );
};
