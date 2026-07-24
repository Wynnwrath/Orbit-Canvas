import React from 'react';

export interface MiniCanvasSnapshot {
  cards?: Array<{ id: string; filename: string; rawText: string; x: number; y: number }>;
  strokes?: Array<{ id: string; d: string }>;
  stickies?: Array<{ id: string; title: string; x: number; y: number }>;
}

interface MiniCanvasPreviewProps {
  previewUrl?: string;
  snapshot?: MiniCanvasSnapshot;
  roomCode: string;
  isHovered?: boolean;
}

export const MiniCanvasPreview: React.FC<MiniCanvasPreviewProps> = ({
  previewUrl,
  snapshot,
  roomCode: _roomCode,
  isHovered = false,
}) => {
  const hasSnapshotData =
    snapshot &&
    ((snapshot.cards && snapshot.cards.length > 0) ||
      (snapshot.strokes && snapshot.strokes.length > 0) ||
      (snapshot.stickies && snapshot.stickies.length > 0));

  return (
    <div
      style={{
        width: '100%',
        height: '160px',
        background: 'var(--bg)',
        position: 'relative',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Dot Grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {previewUrl ? (
        /* Image Snapshot Preview */
        <img
          src={previewUrl}
          alt={`Canvas #${_roomCode}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.9)',
            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ) : hasSnapshotData ? (
        /* Crisp Vector Mini Canvas Renderer */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* SVG Layer for Ink Strokes */}
          {snapshot?.strokes && snapshot.strokes.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox="0 0 1000 500"
              preserveAspectRatio="xMidYMid meet"
            >
              {snapshot.strokes.map(stroke => (
                <path
                  key={stroke.id}
                  d={stroke.d}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              ))}
            </svg>
          )}

          {/* Mini Code Cards */}
          {snapshot?.cards && snapshot.cards.slice(0, 3).map((card, i) => {
            // Scale spatial coordinates to fit 160px card thumbnail
            const posX = Math.min(Math.max((card.x || 80) * 0.22, 16), 180);
            const posY = Math.min(Math.max((card.y || 60) * 0.18, 16), 70);

            return (
              <div
                key={card.id || i}
                style={{
                  position: 'absolute',
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: '130px',
                  height: '64px',
                  background: 'var(--card)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: '8px',
                  padding: '6px',
                  boxShadow: isHovered
                    ? '0 8px 20px rgba(0,0,0,0.6), 0 0 16px rgba(34, 211, 238, 0.25)'
                    : '0 4px 12px rgba(0,0,0,0.5)',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.25s ease',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--red)' }} />
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--amber)' }} />
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--live)' }} />
                  <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginLeft: '4px' }}>
                    {card.filename || 'code.ts'}
                  </span>
                </div>
                <div style={{ height: '3px', width: '70%', background: 'var(--accent)', borderRadius: '2px', marginBottom: '3px', opacity: 0.8 }} />
                <div style={{ height: '3px', width: '50%', background: 'var(--muted)', borderRadius: '2px', marginBottom: '3px', opacity: 0.5 }} />
                <div style={{ height: '3px', width: '80%', background: 'var(--violet)', borderRadius: '2px', opacity: 0.7 }} />
              </div>
            );
          })}

          {/* Mini AI Stickies */}
          {snapshot?.stickies && snapshot.stickies.slice(0, 2).map((sticky, i) => {
            const posX = Math.min(Math.max((sticky.x || 200) * 0.22, 140), 220);
            const posY = Math.min(Math.max((sticky.y || 40) * 0.18, 12), 65);

            return (
              <div
                key={sticky.id || i}
                style={{
                  position: 'absolute',
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: '90px',
                  height: '52px',
                  background: 'rgba(18, 18, 22, 0.9)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: '8px',
                  padding: '5px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.25s ease',
                  pointerEvents: 'none',
                }}
              >
                <span className="code-badge" style={{ fontSize: '7px', padding: '1px 4px', display: 'inline-block', marginBottom: '3px' }}>
                  AI TUTOR
                </span>
                <div style={{ height: '2.5px', width: '90%', background: 'var(--accent)', borderRadius: '2px', marginBottom: '2px' }} />
                <div style={{ height: '2.5px', width: '60%', background: 'var(--fg)', borderRadius: '2px' }} />
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback Default Design Icon */
        <div style={{ textAlign: 'center', pointerEvents: 'none', transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.25s ease' }}>
          <div style={{ fontSize: '28px', opacity: 0.6, marginBottom: '2px' }}>✨</div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>
            Spatial Whiteboard
          </span>
        </div>
      )}
    </div>
  );
};
