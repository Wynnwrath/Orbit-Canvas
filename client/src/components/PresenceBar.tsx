import React from 'react';

export interface UserPresence {
  name: string;
  color: string;
}

interface PresenceBarProps {
  roomCode: string;
  users: UserPresence[];
  loading?: boolean;
}

export const PresenceBar: React.FC<PresenceBarProps> = ({ roomCode, users, loading = false }) => {
  if (loading) {
    return (
      <div className="presence" data-od-id="join-presence">
        <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Checking room availability…</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="presence" data-od-id="join-presence">
        <p>Be the first to join room <b>#{roomCode}</b>.</p>
      </div>
    );
  }

  const avatarClasses = ['av-a', 'av-b', 'av-c'];

  const namesText = () => {
    if (users.length === 1) return <b>{users[0].name}</b>;
    if (users.length === 2) return <><b key="1">{users[0].name}</b> and <b key="2">{users[1].name}</b></>;
    const firstTwo = users.slice(0, 2).map(u => u.name).join(', ');
    const rest = users.length - 2;
    return <><b key="1">{firstTwo}</b> and <b key="2">{rest} other{rest > 1 ? 's' : ''}</b></>;
  };

  return (
    <div className="presence" data-od-id="join-presence">
      <div className="avatars">
        {users.slice(0, 3).map((u, i) => (
          <span
            key={i}
            className={`av ${avatarClasses[i % avatarClasses.length]}`}
            title={u.name}
          >
            {u.name.charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
      <p>
        {namesText()} {users.length === 1 ? 'is' : 'are'} already sketching in <b>#{roomCode}</b>.
      </p>
    </div>
  );
};
