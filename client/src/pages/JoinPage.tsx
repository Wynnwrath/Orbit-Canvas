import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { RoomForm } from '../components/RoomForm';
import { NewRoomButton } from '../components/NewRoomButton';
import { PresenceBar } from '../components/PresenceBar';
import type { UserPresence } from '../components/PresenceBar';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { HintLine } from '../components/HintLine';
import { apiRequest } from '../services/api';
import { useSavedRooms } from '../hooks/useSavedRooms';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedName, updateSavedName, savedRooms, addSavedRoom } = useSavedRooms();

  const [presenceUsers, setPresenceUsers] = useState<UserPresence[]>([]);
  const [roomCode] = useState('8F2A');
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch room presence info
  useEffect(() => {
    let isMounted = true;
    const fetchPresence = async () => {
      setPresenceLoading(true);
      const res = await apiRequest<{ users: UserPresence[] }>(`/api/rooms/${roomCode}`);
      if (isMounted) {
        if (res.ok && res.data?.users) {
          setPresenceUsers(res.data.users);
        } else {
          setPresenceUsers([]);
        }
        setPresenceLoading(false);
      }
    };

    fetchPresence();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  const handleJoin = async (targetCode: string, name: string) => {
    setFormLoading(true);
    setApiError(null);

    const res = await apiRequest<{ code: string; title?: string }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code: targetCode, name })
    });

    setFormLoading(false);

    if (res.ok && res.data) {
      updateSavedName(name);
      addSavedRoom(res.data.code, res.data.title || `Workspace #${res.data.code}`, false);
      navigate(`/canvas/${res.data.code}?name=${encodeURIComponent(name)}`);
    } else {
      setApiError(res.error || 'Failed to join room');
    }
  };

  const handleCreateFromModal = async (title: string, name: string, customCode?: string) => {
    setFormLoading(true);
    setApiError(null);

    const res = await apiRequest<{ code: string; title: string }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ code: customCode, title })
    });

    setFormLoading(false);

    if (res.ok && res.data) {
      updateSavedName(name);
      addSavedRoom(res.data.code, res.data.title || title, true);
      setIsModalOpen(false);
      navigate(`/canvas/${res.data.code}?name=${encodeURIComponent(name)}`);
    } else {
      setApiError(res.error || 'Failed to create room');
    }
  };

  return (
    <>
      <DotGridBg masked />
      <main style={{ margin: 'auto', display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '20px 0' }}>
        <section className="card" data-od-id="join-card">
          <BrandHeader />
          <p className="sub">
            A spatial whiteboard for code, math and ideas — shared live with your team.
          </p>

          <RoomForm
            initialName={savedName}
            initialRoom={roomCode}
            onJoin={handleJoin}
            loading={formLoading}
            apiError={apiError}
          />

          <NewRoomButton
            onCreate={() => setIsModalOpen(true)}
            loading={formLoading}
          />

          {savedRooms.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--accent-border, rgba(56, 189, 248, 0.3))',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '10px',
                  textAlign: 'left'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>
                    ★ Continue Recent Workspace
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {savedRooms[0].title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    #{savedRooms[0].code}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(`/canvas/${savedRooms[0].code}?name=${encodeURIComponent(savedName || 'Nova')}`)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 12px rgba(34, 211, 238, 0.2)'
                  }}
                >
                  Resume →
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                View Canvases Dashboard ({savedRooms.length}) →
              </button>
            </div>
          )}

          <PresenceBar
            roomCode={roomCode}
            users={presenceUsers}
            loading={presenceLoading}
          />
        </section>

        <CreateRoomModal
          isOpen={isModalOpen}
          defaultName={savedName}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateFromModal}
          loading={formLoading}
        />

        <HintLine />
      </main>
    </>
  );
};
