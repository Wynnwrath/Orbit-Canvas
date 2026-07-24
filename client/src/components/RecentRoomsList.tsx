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
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text-sub)',
            fontWeight: 600,
          }}
        >
          Recent Canvases
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-sub)', opacity: 0.7 }}>
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
              border: '1px solid var(--surface-border, rgba(255, 255, 255, 0.08))',
              borderRadius: '10px',
              padding: '8px 12px',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent, #38bdf8)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                #{room.code}
              </span>
              {room.isOwner && (
                <span
                  style={{
                    fontSize: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: 'var(--violet, #c084fc)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  Owner
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                {formatRelativeTime(room.joinedAt)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onRejoin(room.code)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: 'var(--accent, #38bdf8)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
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
                  color: 'var(--text-sub)',
                  opacity: 0.6,
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
