import React from 'react';
import type { SavedRoom } from '../hooks/useSavedRooms';

interface RecentRoomsListProps {
  rooms: SavedRoom[];
  onRejoin: (code: string) => void;
  onRemove: (code: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const RecentRoomsList: React.FC<RecentRoomsListProps> = ({
  rooms,
  onRejoin,
  onRemove,
}) => {
  if (rooms.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '24px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontWeight: 600,
          }}
        >
          Recent Canvases
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>
          Saved locally
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {rooms.map(room => (
          <div
            key={room.code}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="code-badge">
                #{room.code}
              </span>
              {room.isOwner && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(167, 139, 250, 0.15)',
                    color: 'var(--violet)',
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                  }}
                >
                  Owner
                </span>
              )}
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {formatRelativeTime(room.joinedAt)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onRejoin(room.code)}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent-border)',
                }}
              >
                Rejoin →
              </button>

              <button
                type="button"
                onClick={() => onRemove(room.code)}
                title="Remove from saved history"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--faint)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
