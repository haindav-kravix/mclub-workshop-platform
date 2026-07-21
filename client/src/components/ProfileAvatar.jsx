import React, { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../utils/api';

export const ProfileAvatar = ({
  user,
  src,
  name,
  className = 'h-10 w-10 rounded-full object-cover',
  fallbackClassName,
  title
}) => {
  const imageSource = src ?? user?.profilePhoto;
  const label = name || user?.name || user?.email || 'User';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageSource]);

  const resolvedSource = imageSource ? resolveMediaUrl(imageSource) : '';
  const fallbackClasses = fallbackClassName || `${className} flex items-center justify-center bg-secondary text-white object-none`;
  const initial = (label?.trim()?.charAt(0) || 'U').toUpperCase();

  if (resolvedSource && !failed) {
    return (
      <img
        src={resolvedSource}
        alt={label}
        className={className}
        title={title || label}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${fallbackClasses} flex items-center justify-center font-black`}
      title={title || label}
      aria-label={label}
    >
      {initial}
    </div>
  );
};
