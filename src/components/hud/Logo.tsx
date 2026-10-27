import React from 'react';

/** Sun with one orbit and a planet. */
export const Logo: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="4" fill="#ffcf8a" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)" stroke="rgba(236,236,238,0.55)" strokeWidth="1.2" />
    <circle cx="20.2" cy="8.4" r="1.9" fill="#8ab4ff" />
  </svg>
);
