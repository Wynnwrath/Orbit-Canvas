import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  roomCode: string;
  onShare: () => void;
  onSave?: () => void;
  onExport?: () => void;
  users?: { name: string; color: string }[];
  isLive?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  roomCode,
  onShare,
  onSave,
  onExport,
  users = [],
  isLive = true
}) => {
  const navigate = useNavigate();
  const avatarClasses = ['av-a', 'av-b', 'av-c'];

  return (
    <header className="topbar" data-od-id="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="home-btn"
          type="button"
          onClick={() => navigate('/')}
          title="Back to Main Menu"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'background 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Home
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          title="My Canvases Dashboard"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent, #38bdf8)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Dashboard
        </button>
      </div>

      <div className="vr" />

      <div className="brand">
        <span className="bd" />
        orbit-canvas
      </div>
      <div className="vr" />
      <div className="roomchip" id="roomchip" data-od-id="room-chip">
        #{roomCode}
      </div>
      {users.length > 0 && (
        <div className="avatars" data-od-id="presence-stack">
          {users.slice(0, 3).map((u, i) => (
            <span
              key={i}
              className={`av ${avatarClasses[i % avatarClasses.length]}`}
              title={u.name}
            >
              {u.name.charAt(0).toUpperCase()}
            </span>
          ))}
          {users.length > 3 && (
            <span className="av av-more">+{users.length - 3}</span>
          )}
        </div>
      )}
      <div className="live" data-od-id="live-badge">
        <i style={{ background: isLive ? 'var(--live)' : 'var(--faint)' }} />
        {isLive ? 'LIVE' : 'OFFLINE'}
      </div>

      {onSave && (
        <button className="share" type="button" onClick={onSave} title="Save canvas state to cloud">
          Save
        </button>
      )}

      {onExport && (
        <button className="share" type="button" onClick={onExport} title="Export image screenshot of canvas">
          Export
        </button>
      )}

      <button className="share" id="share" data-od-id="share-btn" onClick={onShare}>
        Share Room
      </button>
    </header>
  );
};
