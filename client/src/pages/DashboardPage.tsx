import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useSavedRooms } from '../hooks/useSavedRooms';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { apiRequest } from '../services/api';

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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const { savedName, updateSavedName, savedRooms, addSavedRoom, removeSavedRoom } = useSavedRooms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveBatch, setLiveBatch] = useState<Record<string, { title?: string; previewUrl?: string; activeCount?: number }>>({});

  // Sync live metadata for saved rooms from server
  useEffect(() => {
    if (savedRooms.length === 0) return;
    const fetchBatch = async () => {
      const codes = savedRooms.map(r => r.code);
      const res = await apiRequest<{ rooms: { code: string; title: string; previewUrl?: string; activeCount: number }[] }>('/api/rooms/batch', {
        method: 'POST',
        body: JSON.stringify({ codes })
      });
      if (res.ok && res.data?.rooms) {
        const map: Record<string, { title?: string; previewUrl?: string; activeCount?: number }> = {};
        res.data.rooms.forEach(r => {
          map[r.code] = { title: r.title, previewUrl: r.previewUrl, activeCount: r.activeCount };
        });
        setLiveBatch(map);
      }
    };
    fetchBatch();
  }, [savedRooms]);

  const handleCreateRoom = async (title: string, name: string, customCode?: string) => {
    setLoading(true);
    const res = await apiRequest<{ code: string; title: string }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ code: customCode, title })
    });
    setLoading(false);

    if (res.ok && res.data) {
      updateSavedName(name);
      addSavedRoom(res.data.code, res.data.title || title, true);
      setIsModalOpen(false);
      navigate(`/canvas/${res.data.code}?name=${encodeURIComponent(name)}`);
    } else {
      showToast(res.error || 'Failed to create room');
    }
  };

  const handleShare = async (code: string) => {
    const link = `${window.location.origin}/canvas/${code}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        showToast(`Copied link for #${code}`);
      } else {
        showToast(link);
      }
    } catch (_err) {
      showToast(link);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', position: 'relative', overflowX: 'hidden' }}>
      <DotGridBg masked />

      {/* Floating Glass Navigation */}
      <nav
        style={{
          position: 'fixed',
          top: '20px',
          left: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '13px',
              boxShadow: 'var(--shadow-topbar)',
            }}
          >
            ← Home
          </button>
          <div
            className="glass-card"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-topbar)',
            }}
          >
            <BrandHeader />
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{
            pointerEvents: 'auto',
            padding: '10px 20px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '13.5px',
          }}
        >
          + New Canvas
        </button>
      </nav>

      {/* Main Dashboard Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 40px 24px', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px', color: 'var(--fg)' }}>
            My Spatial Canvases
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '15px' }}>
            Live visual previews of your collaborative code & idea whiteboards.
          </p>
        </div>

        {savedRooms.length === 0 ? (
          /* Standardized Glass Empty State */
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              borderStyle: 'dashed',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--fg)' }}>
              No Canvases Created Yet
            </h3>
            <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
              Create your first spatial whiteboard to draw diagrams, write code cards, and analyze with Gemini AI.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
              }}
            >
              + Create Your First Canvas
            </button>
          </div>
        ) : (
          /* Standardized Glass Card Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {savedRooms.map(room => {
              const liveData = liveBatch[room.code];
              const displayTitle = liveData?.title || room.title || `Workspace #${room.code}`;
              const previewImage = liveData?.previewUrl;
              const activeCount = liveData?.activeCount || 0;

              return (
                <div
                  key={room.code}
                  className="glass-card"
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  {/* Real Spatial Canvas Preview Box */}
                  <div
                    style={{
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
                    {previewImage ? (
                      /* Actual Canvas Thumbnail Snapshot */
                      <img
                        src={previewImage}
                        alt={displayTitle}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(0.9)',
                        }}
                      />
                    ) : (
                      /* Placeholder dot grid when no preview captured yet */
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
                          backgroundSize: '16px 16px',
                          display: 'grid',
                          placeItems: 'center',
                          opacity: 0.6,
                        }}
                      >
                        <span style={{ fontSize: '24px', opacity: 0.4 }}>✨</span>
                      </div>
                    )}

                    {/* Monospace Code Badge */}
                    <span
                      className="code-badge"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(9, 9, 11, 0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 3,
                      }}
                    >
                      #{room.code}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--fg)' }}>
                          {displayTitle}
                        </h3>
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
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>🕒 {formatRelativeTime(room.joinedAt)}</span>
                        {activeCount > 0 && (
                          <span style={{ color: 'var(--live)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            ● {activeCount} active user{activeCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate(`/canvas/${room.code}?name=${encodeURIComponent(savedName || 'Nova')}`)}
                        style={{
                          flex: 1,
                          padding: '9px',
                          fontSize: '13px',
                        }}
                      >
                        Open Canvas →
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleShare(room.code)}
                        title="Copy Room Link"
                        style={{
                          padding: '9px 12px',
                          fontSize: '13px',
                        }}
                      >
                        🔗
                      </button>

                      <button
                        type="button"
                        onClick={() => removeSavedRoom(room.code)}
                        title="Remove canvas"
                        style={{
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          color: 'var(--red)',
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'background 0.15s',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CreateRoomModal
        isOpen={isModalOpen}
        defaultName={savedName}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateRoom}
        loading={loading}
      />

      <Toast message={toastMessage} />
    </div>
  );
};
