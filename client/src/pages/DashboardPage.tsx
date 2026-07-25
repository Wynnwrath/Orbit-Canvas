import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LinkSimple, Trash, ArrowLeft, Palette, Sun, Moon } from '@phosphor-icons/react';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useSavedRooms } from '../hooks/useSavedRooms';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { MiniCanvasPreview } from '../components/MiniCanvasPreview';
import type { MiniCanvasSnapshot } from '../components/MiniCanvasPreview';
import { apiRequest } from '../services/api';
import { useThemeStore } from '../stores/theme.store';

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
  const { mode, setMode } = useThemeStore();
  const { toastMessage, showToast } = useToast();
  const { savedName, updateSavedName, savedRooms, addSavedRoom, removeSavedRoom } = useSavedRooms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [liveBatch, setLiveBatch] = useState<Record<string, { title?: string; hasPreview?: boolean; snapshot?: MiniCanvasSnapshot; activeCount?: number }>>({});

  const PREVIEW_CACHE_KEY = 'orbit_canvas_preview_cache';
  const [previewCache, setPreviewCache] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PREVIEW_CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (savedRooms.length === 0) return;
    const fetchBatch = async () => {
      const codes = savedRooms.map(r => r.code);
      const res = await apiRequest<{ rooms: { code: string; title: string; hasPreview: boolean; snapshot?: MiniCanvasSnapshot; activeCount: number }[] }>('/api/rooms/batch', {
        method: 'POST',
        body: JSON.stringify({ codes })
      });
      if (res.ok && res.data?.rooms) {
        const map: Record<string, { title?: string; hasPreview?: boolean; snapshot?: MiniCanvasSnapshot; activeCount?: number }> = {};
        res.data.rooms.forEach(r => {
          map[r.code] = { title: r.title, hasPreview: r.hasPreview, snapshot: r.snapshot, activeCount: r.activeCount };
        });
        setLiveBatch(map);

        // Fetch & cache thumbnail images for rooms that have previews but are not yet in local cache
        for (const r of res.data.rooms) {
          if (r.hasPreview && !previewCache[r.code]) {
            try {
              const imgRes = await fetch(`/api/rooms/${r.code}/preview`);
              if (imgRes.ok) {
                const blob = await imgRes.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  setPreviewCache(prev => {
                    const next = { ...prev, [r.code]: dataUrl };
                    // Limit cache size to 20 previews
                    const keys = Object.keys(next);
                    if (keys.length > 20) {
                      delete next[keys[0]];
                    }
                    try {
                      localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                };
                reader.readAsDataURL(blob);
              }
            } catch {
              /* ignore */
            }
          }
        }
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      <DotGridBg masked />

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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={14} weight="regular" />
            Home
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '13px',
              boxShadow: 'var(--shadow-topbar)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mode === 'dark' ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '13.5px',
            }}
          >
            + New Canvas
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '110px 24px 80px 24px', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px', color: 'var(--fg)' }}>
            My Spatial Canvases
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '15px' }}>
            Live vector mini previews of your collaborative code & idea whiteboards.
          </p>
        </div>

        {savedRooms.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              borderStyle: 'dashed',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--accent)', display: 'flex', justifyContent: 'center' }}>
              <Palette size={48} weight="light" />
            </div>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {savedRooms.map((room, index) => {
              const liveData = liveBatch[room.code];
              const displayTitle = liveData?.title || room.title || `Workspace #${room.code}`;
              const cachedPreview = previewCache[room.code];
              const previewImage = liveData?.hasPreview
                ? (cachedPreview || `/api/rooms/${room.code}/preview`)
                : undefined;
              const snapshotData = liveData?.snapshot;
              const activeCount = liveData?.activeCount || 0;
              const isHovered = hoveredCard === room.code;

              return (
                <div
                  key={room.code}
                  className="glass-card"
                  onMouseEnter={() => setHoveredCard(room.code)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    borderColor: isHovered ? 'var(--accent-border)' : 'var(--border)',
                    boxShadow: isHovered
                      ? 'var(--shadow-heavy)'
                      : 'var(--shadow-topbar)',
                  }}
                >
                  <MiniCanvasPreview
                    previewUrl={previewImage}
                    snapshot={snapshotData}
                    roomCode={room.code}
                    isHovered={isHovered}
                  />

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--fg)' }}>
                          {displayTitle}
                        </h3>
                        {index === 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: 'var(--accent)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                            }}
                          >
                            Most Recent
                          </span>
                        )}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          Opened {formatRelativeTime(room.lastOpenedAt || room.joinedAt)}
                        </span>
                        {activeCount > 0 && (
                          <span style={{ color: 'var(--live)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            &#9679; {activeCount} active user{activeCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

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
                        Open Canvas
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleShare(room.code)}
                        title="Copy Room Link"
                        style={{
                          padding: '9px 12px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LinkSimple size={16} weight="regular" />
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash size={16} weight="regular" />
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
