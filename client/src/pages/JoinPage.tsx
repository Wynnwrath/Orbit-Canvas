import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { RoomForm } from '../components/RoomForm';
import { NewRoomButton } from '../components/NewRoomButton';
import { PresenceBar } from '../components/PresenceBar';
import type { UserPresence } from '../components/PresenceBar';
import { RecentRoomsList } from '../components/RecentRoomsList';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { HintLine } from '../components/HintLine';
import { apiRequest } from '../services/api';
import { useSavedRooms } from '../hooks/useSavedRooms';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedName, updateSavedName, savedRooms, addSavedRoom, removeSavedRoom } = useSavedRooms();

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

  const handleRejoinRecent = (code: string) => {
    const activeName = savedName || 'Nova';
    const roomItem = savedRooms.find(r => r.code === code);
    addSavedRoom(code, roomItem?.title, false);
    navigate(`/canvas/${code}?name=${encodeURIComponent(activeName)}`);
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
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: 'var(--accent, #38bdf8)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
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

          <RecentRoomsList
            rooms={savedRooms.slice(0, 3)}
            onRejoin={handleRejoinRecent}
            onRemove={removeSavedRoom}
          />

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
