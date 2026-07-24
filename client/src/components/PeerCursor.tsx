import React from 'react';

export interface PeerData {
  id: string;
  name: string;
  cls: 'peer-a' | 'peer-b' | 'peer-c';
  x: number;
  y: number;
}

interface PeerCursorProps {
  peer: PeerData;
}

export const PeerCursor: React.FC<PeerCursorProps> = ({ peer }) => {
  return (
    <div
      className={`peer ${peer.cls}`}
      data-od-id={`peer-${peer.name.toLowerCase()}`}
      style={{
        transform: `translate(${peer.x}px, ${peer.y}px)`,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M4 2 L20 12 L12.5 13.5 L9 21 Z" style={{ fill: 'var(--pc)' }} />
      </svg>
      <span className="tag">{peer.name}</span>
    </div>
  );
};
