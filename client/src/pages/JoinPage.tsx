import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { RoomForm } from '../components/RoomForm';
import { NewRoomButton } from '../components/NewRoomButton';
import { PresenceBar } from '../components/PresenceBar';
import type { UserPresence } from '../components/PresenceBar';
import { RecentRoomsList } from '../components/RecentRoomsList';
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

    const res = await apiRequest<{ code: string }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code: targetCode, name })
    });

    setFormLoading(false);

    if (res.ok && res.data) {
      updateSavedName(name);
      addSavedRoom(res.data.code, false);
      navigate(`/canvas/${res.data.code}?name=${encodeURIComponent(name)}`);
    } else {
      setApiError(res.error || 'Failed to join room');
    }
  };

  const handleCreate = async (newCode: string) => {
    setFormLoading(true);
    setApiError(null);

    const res = await apiRequest<{ code: string }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ code: newCode })
    });

    setFormLoading(false);

    if (res.ok && res.data) {
      const activeName = savedName || 'Nova';
      updateSavedName(activeName);
      addSavedRoom(res.data.code, true);
      navigate(`/canvas/${res.data.code}?name=${encodeURIComponent(activeName)}`);
    } else {
      setApiError(res.error || 'Failed to create room');
    }
  };

  const handleRejoinRecent = (code: string) => {
    const activeName = savedName || 'Nova';
    addSavedRoom(code, false);
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
            onCreate={handleCreate}
            loading={formLoading}
          />

          <RecentRoomsList
            rooms={savedRooms}
            onRejoin={handleRejoinRecent}
            onRemove={removeSavedRoom}
          />

          <PresenceBar
            roomCode={roomCode}
            users={presenceUsers}
            loading={presenceLoading}
          />
        </section>

        <HintLine />
      </main>
    </>
  );
};
