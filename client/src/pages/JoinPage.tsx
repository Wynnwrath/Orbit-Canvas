import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { DotGridBg } from '../components/DotGridBg';
import { BrandHeader } from '../components/BrandHeader';
import { RoomForm } from '../components/RoomForm';
import { NewRoomButton } from '../components/NewRoomButton';
import { PresenceBar } from '../components/PresenceBar';
import type { UserPresence } from '../components/PresenceBar';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { HintLine } from '../components/HintLine';
import { OrbitalHero } from '../components/OrbitalHero';
import { RecentWorkspaceCard } from '../components/RecentWorkspaceCard';
import { apiRequest } from '../services/api';
import { useSavedRooms } from '../hooks/useSavedRooms';
import { easings, durations } from '../lib/animation';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedName, updateSavedName, savedRooms, addSavedRoom } = useSavedRooms();

  const [presenceUsers, setPresenceUsers] = useState<UserPresence[]>([]);
  const [roomCode] = useState('8F2A');
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="cosmic-rings" />

      <div className="join-hero">
        <OrbitalHero />

        <motion.section
          className="join-action-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easings.spring, delay: 0.2 }}
        >
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
              <RecentWorkspaceCard
                code={savedRooms[0].code}
                title={savedRooms[0].title}
                savedName={savedName}
                delay={0.7}
              />

              <motion.button
                type="button"
                className="dashboard-link-btn"
                onClick={() => navigate('/dashboard')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: durations.fast, delay: 0.8 }}
                style={{ marginTop: '10px' }}
              >
                View Canvases Dashboard ({savedRooms.length})
              </motion.button>
            </div>
          )}

          <PresenceBar
            roomCode={roomCode}
            users={presenceUsers}
            loading={presenceLoading}
          />
        </motion.section>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        defaultName={savedName}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFromModal}
        loading={formLoading}
      />

      <HintLine />
    </>
  );
};
