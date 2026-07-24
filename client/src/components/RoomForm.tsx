import React, { useState, useEffect } from 'react';

interface RoomFormProps {
  initialName?: string;
  initialRoom?: string;
  onJoin: (roomCode: string, name: string) => Promise<void>;
  loading?: boolean;
  apiError?: string | null;
}

export const RoomForm: React.FC<RoomFormProps> = ({
  initialName = '',
  initialRoom = '8F2A',
  onJoin,
  loading = false,
  apiError = null,
}) => {
  const [name, setName] = useState(initialName);
  const [room, setRoom] = useState(initialRoom);
  const [nameTouched, setNameTouched] = useState(false);
  const [roomTouched, setRoomTouched] = useState(false);

  useEffect(() => {
    if (initialName && !name) {
      setName(initialName);
    }
  }, [initialName]);

  const cleanRoomCode = (val: string) => val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoom(cleanRoomCode(e.target.value));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 16) {
      setName(e.target.value);
    }
  };

  const isNameValid = name.trim().length > 0;
  const isRoomValid = room.length >= 4 && room.length <= 6;
  const isSubmitDisabled = !isNameValid || !isRoomValid || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setRoomTouched(true);

    if (!isNameValid || !isRoomValid) return;

    await onJoin(room, name.trim());
  };

  return (
    <form id="join" data-od-id="join-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Display name</label>
        <input
          id="name"
          autoComplete="off"
          placeholder="e.g. Nova"
          maxLength={16}
          value={name}
          onChange={handleNameChange}
          onBlur={() => setNameTouched(true)}
          disabled={loading}
          autoFocus
          style={{
            borderColor: nameTouched && !isNameValid ? 'var(--red)' : undefined,
          }}
        />
        {nameTouched && !isNameValid && (
          <span style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
            Please enter a display name (max 16 chars).
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="room">Room code</label>
        <div className="roomwrap">
          <span>#</span>
          <input
            id="room"
            value={room}
            onChange={handleRoomChange}
            onBlur={() => setRoomTouched(true)}
            autoComplete="off"
            maxLength={6}
            spellCheck={false}
            disabled={loading}
            style={{
              borderColor: roomTouched && !isRoomValid ? 'var(--red)' : undefined,
            }}
          />
        </div>
        {roomTouched && !isRoomValid && (
          <span style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
            Room code must be 4–6 characters.
          </span>
        )}
      </div>

      {apiError && (
        <div
          style={{
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.4)',
            color: 'var(--red)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {apiError}
        </div>
      )}

      <button
        className="join"
        type="submit"
        data-od-id="join-submit"
        disabled={isSubmitDisabled}
        style={{
          opacity: isSubmitDisabled ? 0.45 : 1,
          cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
          filter: isSubmitDisabled ? 'none' : undefined,
        }}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="spin" style={{ width: '14px', height: '14px', borderTopColor: 'var(--accent-ink)' }} />
            Joining…
          </span>
        ) : (
          'Join room →'
        )}
      </button>
    </form>
  );
};
