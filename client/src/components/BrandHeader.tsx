import React from 'react';

export const BrandHeader: React.FC = () => {
  return (
    <div className="brand" data-od-id="join-brand">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
        <ellipse
          cx="16"
          cy="16"
          rx="13"
          ry="5.5"
          fill="none"
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.2"
          transform="rotate(-24 16 16)"
        />
        <circle cx="16" cy="16" r="4" fill="var(--accent)" />
        <circle cx="26.4" cy="11.3" r="2.1" fill="#ffffff" />
      </svg>
      <h1>Orbit Canvas</h1>
      <span className="tag-word">BETA</span>
    </div>
  );
};
