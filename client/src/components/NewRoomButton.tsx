import React from 'react';

interface NewRoomButtonProps {
  onCreate: (code: string) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

const UNAMBIGUOUS_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const NewRoomButton: React.FC<NewRoomButtonProps> = ({
  onCreate,
  disabled = false,
  loading = false,
}) => {
  const handleClick = async () => {
    if (disabled || loading) return;

    let code = '';
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
      code += UNAMBIGUOUS_CHARS[idx];
    }

    await onCreate(code);
  };

  return (
    <>
      <div className="alt">or</div>
      <button
        className="newroom"
        id="newroom"
        data-od-id="new-room"
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        style={{
          opacity: disabled || loading ? 0.45 : 1,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Creating room…' : 'Create a fresh room'}
      </button>
    </>
  );
};
