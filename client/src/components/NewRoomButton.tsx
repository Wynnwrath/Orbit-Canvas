import React from 'react';

interface NewRoomButtonProps {
  onCreate: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export const NewRoomButton: React.FC<NewRoomButtonProps> = ({
  onCreate,
  disabled = false,
  loading = false,
}) => {
  const handleClick = async () => {
    if (disabled || loading) return;
    await onCreate();
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
