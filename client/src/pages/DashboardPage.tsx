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
  const [liveBatch, setLiveBatch] = useState<Record<string, { title?: string; activeCount?: number }>>({});

  // Sync live metadata for saved rooms from server
  useEffect(() => {
    if (savedRooms.length === 0) return;
    const fetchBatch = async () => {
      const codes = savedRooms.map(r => r.code);
      const res = await apiRequest<{ rooms: { code: string; title: string; activeCount: number }[] }>('/api/rooms/batch', {
        method: 'POST',
        body: JSON.stringify({ codes })
      });
      if (res.ok && res.data?.rooms) {
        const map: Record<string, { title?: string; activeCount?: number }> = {};
        res.data.rooms.forEach(r => {
          map[r.code] = { title: r.title, activeCount: r.activeCount };
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
    <div style={{ minHeight: '100vh', background: '#070913', color: '#f8fafc', position: 'relative', overflowX: 'hidden' }}>
      <DotGridBg masked />

      {/* Top Dashboard Header */}
      <header
        style={{
          borderBottom: '1px solid var(--surface-border, rgba(255,255,255,0.08))',
          background: 'rgba(13, 17, 34, 0.75)',
          backdropFilter: 'blur(16px)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '1px solid var(--surface-border, rgba(255,255,255,0.12))',
              color: 'var(--text-sub, #94a3b8)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ← Home
          </button>
          <BrandHeader />
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            color: '#070913',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
          }}
        >
          + New Canvas
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            My Spatial Canvases
          </h1>
          <p style={{ color: 'var(--text-sub, #94a3b8)', margin: 0, fontSize: '15px' }}>
            Preview, manage and rejoin your collaborative code & idea whiteboards.
          </p>
        </div>

        {savedRooms.length === 0 ? (
          /* Empty State */
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'rgba(13, 17, 34, 0.4)',
              border: '1px dashed var(--surface-border, rgba(255,255,255,0.12))',
              borderRadius: '24px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>No Canvases Created Yet</h3>
            <p style={{ color: 'var(--text-sub, #94a3b8)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
              Create your first spatial whiteboard to draw diagrams, write code cards, and analyze with Gemini AI.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                color: '#070913',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Create Your First Canvas
            </button>
          </div>
        ) : (
          /* Visual Cards Grid */
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
              const activeCount = liveData?.activeCount || 0;

              return (
                <div
                  key={room.code}
                  className="card"
                  style={{
                    background: 'rgba(13, 17, 34, 0.75)',
                    border: '1px solid var(--surface-border, rgba(255, 255, 255, 0.1))',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Spatial Canvas Preview Box */}
                  <div
                    style={{
                      height: '140px',
                      background: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.15), transparent 70%), #070913',
                      position: 'relative',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Visual Dot Grid background simulation */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                        opacity: 0.6,
                      }}
                    />

                    {/* Simulated Mini Code Card Graphic */}
                    <div
                      style={{
                        width: '160px',
                        height: '80px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '10px',
                        padding: '8px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                        zIndex: 2,
                        transform: 'rotate(-2deg)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
                      </div>
                      <div style={{ height: '4px', width: '70%', background: 'rgba(56, 189, 248, 0.6)', borderRadius: '2px', marginBottom: '4px' }} />
                      <div style={{ height: '4px', width: '50%', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '2px', marginBottom: '4px' }} />
                      <div style={{ height: '4px', width: '85%', background: 'rgba(168, 85, 247, 0.5)', borderRadius: '2px' }} />
                    </div>

                    {/* Room Code Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
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
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                          {displayTitle}
                        </h3>
                        {room.isOwner && (
                          <span
                            style={{
                              fontSize: '10px',
                              background: 'rgba(168, 85, 247, 0.2)',
                              color: '#c084fc',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Owner
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                        <span>🕒 {formatRelativeTime(room.joinedAt)}</span>
                        {activeCount > 0 && (
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>● {activeCount} active user{activeCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/canvas/${room.code}?name=${encodeURIComponent(savedName || 'Nova')}`)}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                          color: '#070913',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Open Canvas →
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(room.code)}
                        title="Copy Room Link"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#94a3b8',
                          padding: '10px',
                          borderRadius: '10px',
                          cursor: 'pointer',
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
                          background: 'rgba(248,113,113,0.1)',
                          border: '1px solid rgba(248,113,113,0.2)',
                          color: '#f87171',
                          padding: '10px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '13px',
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
