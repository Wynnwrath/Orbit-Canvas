import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const avatarClasses = ['av-a', 'av-b', 'av-c'];

  return (
    <>
      <header className="topbar" data-od-id="topbar">
        <div className="topbar-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            <span className="nav-text">Home</span>
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
            <span className="nav-text">Dashboard</span>
          </button>
        </div>

        <div className="vr topbar-desktop-nav" />

        <div className="brand">
          <span className="bd" />
          orbit
        </div>
        <div className="vr" />
        <div className="roomchip" id="roomchip" data-od-id="room-chip">
          #{roomCode}
        </div>

        {users.length > 0 && (
          <div className="avatars topbar-desktop-nav" data-od-id="presence-stack">
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

        <div className="live topbar-desktop-nav" data-od-id="live-badge">
          <i style={{ background: isLive ? 'var(--live)' : 'var(--faint)' }} />
          {isLive ? 'LIVE' : 'OFFLINE'}
        </div>

        <div className="topbar-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            Share
          </button>
        </div>

        {/* Mobile Overflow Menu Toggle Button */}
        <button
          className="mobile-overflow-btn"
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          title="More actions"
          aria-label="Toggle mobile menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </header>

      {/* Mobile Slide-up Action Sheet Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand">
                <span className="bd" />
                orbit canvas #{roomCode}
              </div>
              <button className="close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>

            <div className="mobile-drawer-body">
              <button
                className="drawer-action-btn primary"
                onClick={() => { setMobileMenuOpen(false); onShare(); }}
              >
                🔗 Share Room Link
              </button>

              {onSave && (
                <button
                  className="drawer-action-btn"
                  onClick={() => { setMobileMenuOpen(false); onSave(); }}
                >
                  ☁️ Save Canvas to Cloud
                </button>
              )}

              {onExport && (
                <button
                  className="drawer-action-btn"
                  onClick={() => { setMobileMenuOpen(false); onExport(); }}
                >
                  📸 Export PNG Image
                </button>
              )}

              <hr className="drawer-divider" />

              <button
                className="drawer-action-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
              >
                📊 Dashboard
              </button>

              <button
                className="drawer-action-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

