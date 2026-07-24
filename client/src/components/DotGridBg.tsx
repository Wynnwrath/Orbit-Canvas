import React from 'react';

interface DotGridBgProps {
  masked?: boolean;
}

export const DotGridBg: React.FC<DotGridBgProps> = ({ masked = false }) => {
  return (
    <>
      <div
        className={`dotgrid ${masked ? 'dotgrid-masked' : ''}`}
        data-od-id="join-grid"
      />
      {masked && <div className="glow" />}
    </>
  );
};
