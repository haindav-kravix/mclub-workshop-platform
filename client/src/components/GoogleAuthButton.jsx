import React from 'react';
import { FcGoogle } from 'react-icons/fc';

export const GoogleAuthButton = ({
  onClick,
  label = 'Continue with Google',
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="google-auth-button"
  >
    <FcGoogle className="text-2xl flex-none" />
    <span>{label}</span>
  </button>
);
