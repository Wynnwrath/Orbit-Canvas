import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  SquaresFour,
  DotsThreeVertical,
  ShareNetwork,
  FloppyDisk,
  Image as ImageIcon,
  X,
  CloudArrowUp,
  Camera,
  House,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { useThemeStore } from '../stores/theme.store';

interface TopBarProps {
  roomCode: string;
  roomTitle?: string;
  onShare: () => void;
  onSave?: () => void;
  onExport?: () => void;
  users?: { name: string; color: string }[];
  isLive?: boolean;
  savedRooms?: { code: string; title: string }[];
  onSwitchRoom?: (code: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  roomCode,
  roomTitle = '',
  onShare,
  onSave,
  onExport,
  users = [],
  isLive = true,
  savedRooms = [],
  onSwitchRoom
}) => {
  const navigate = useNavigate();
  const { mode, setMode } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const avatarClasses = ['av-a', 'av-b', 'av-c'];

  const displayTitle = roomTitle || `Workspace #${roomCode}`;

  return (
    <>
      <header
        className="topbar"
        data-od-id="topbar"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
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
            <ArrowLeft size={14} weight="regular" />
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
            <SquaresFour size={14} weight="regular" />
            <span className="nav-text">Dashboard</span>
          </button>
        </div>

        <div className="vr topbar-desktop-nav" />

        <div 
          className="brand"
          style={{ position: 'relative', cursor: savedRooms.length > 1 ? 'pointer' : 'default' }}
          onClick={() => savedRooms.length > 1 && setSwitcherOpen(prev => !prev)}
          title={savedRooms.length > 1 ? 'Click to switch recent canvas' : displayTitle}
        >
          <span className="bd" />
          <span style={{ 
            maxWidth: '180px', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: 'inline-block',
            fontWeight: 600
          }}>
            {displayTitle}
          </span>
          {savedRooms.length > 1 && (
            <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>▼</span>
          )}

          {switcherOpen && savedRooms.length > 1 && (
            <div 
              className="glass-medium"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                borderRadius: 'var(--radius-md)',
                padding: '6px',
                minWidth: '220px',
                zIndex: 9999,
                boxShadow: 'var(--shadow-heavy)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '4px 8px 6px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                Recent Canvases
              </div>
              {savedRooms.map(r => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => {
                    setSwitcherOpen(false);
                    if (r.code !== roomCode) {
                      if (onSwitchRoom) onSwitchRoom(r.code);
                      else navigate(`/canvas/${r.code}`);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    background: r.code === roomCode ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    color: r.code === roomCode ? 'var(--accent)' : 'var(--fg)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {r.title}
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                    #{r.code}
                  </span>
                </button>
              ))}
            </div>
          )}
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
              <FloppyDisk size={14} weight="regular" style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
              Save
            </button>
          )}

          {onExport && (
            <button className="share" type="button" onClick={onExport} title="Export image screenshot of canvas">
              <ImageIcon size={14} weight="regular" style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
              Export
            </button>
          )}

          <button className="share" id="share" data-od-id="share-btn" onClick={onShare}>
            <ShareNetwork size={14} weight="regular" style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
            Share
          </button>

          <button
            className="share"
            type="button"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 9px' }}
          >
            {mode === 'dark' ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
          </button>
        </div>

        <button
          className="mobile-overflow-btn"
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          title="More actions"
          aria-label="Toggle mobile menu"
        >
          <DotsThreeVertical size={18} weight="bold" />
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand">
                <span className="bd" />
                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {displayTitle}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.6, marginLeft: '6px' }}>#{roomCode}</span>
              </div>
              <button className="close" onClick={() => setMobileMenuOpen(false)}>
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="mobile-drawer-body">
              <button
                className="drawer-action-btn primary"
                onClick={() => { setMobileMenuOpen(false); onShare(); }}
              >
                <ShareNetwork size={16} weight="regular" style={{ marginRight: '6px' }} />
                Share Room Link
              </button>

              {onSave && (
                <button
                  className="drawer-action-btn"
                  onClick={() => { setMobileMenuOpen(false); onSave(); }}
                >
                  <CloudArrowUp size={16} weight="regular" style={{ marginRight: '6px' }} />
                  Save Canvas to Cloud
                </button>
              )}

              {onExport && (
                <button
                  className="drawer-action-btn"
                  onClick={() => { setMobileMenuOpen(false); onExport(); }}
                >
                  <Camera size={16} weight="regular" style={{ marginRight: '6px' }} />
                  Export PNG Image
                </button>
              )}

              <button
                className="drawer-action-btn"
                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              >
                {mode === 'dark' ? (
                  <>
                    <Sun size={16} weight="bold" style={{ marginRight: '6px' }} />
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <Moon size={16} weight="bold" style={{ marginRight: '6px' }} />
                    Switch to Dark Mode
                  </>
                )}
              </button>

              <hr className="drawer-divider" />

              <button
                className="drawer-action-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
              >
                <SquaresFour size={16} weight="regular" style={{ marginRight: '6px' }} />
                Dashboard
              </button>

              <button
                className="drawer-action-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
              >
                <House size={16} weight="regular" style={{ marginRight: '6px' }} />
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
