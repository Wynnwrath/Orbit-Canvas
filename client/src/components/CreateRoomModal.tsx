import React, { useState } from 'react';

interface CreateRoomModalProps {
  isOpen: boolean;
  defaultName?: string;
  onClose: () => void;
  onCreate: (title: string, name: string, customCode?: string) => Promise<void>;
  loading?: boolean;
}

const UNAMBIGUOUS_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateQuickCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += UNAMBIGUOUS_CHARS[Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)];
  }
  return code;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  defaultName = '',
  onClose,
  onCreate,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [name, setName] = useState(defaultName || 'Nova');
  const [code, setCode] = useState(() => generateQuickCode());
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const isTitleValid = title.trim().length > 0;
  const isNameValid = name.trim().length > 0;
  const isSubmitDisabled = !isTitleValid || !isNameValid || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isTitleValid || !isNameValid) return;
    await onCreate(title.trim(), name.trim(), code.trim() || undefined);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--surface-bg, rgba(13, 17, 34, 0.95))',
          border: '1px solid var(--cyan-glow, rgba(56, 189, 248, 0.3))',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(56, 189, 248, 0.15)',
          borderRadius: '20px',
          padding: '28px',
          animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
            Create New Canvas
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-sub)',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Room Title Field */}
          <div className="field" style={{ marginBottom: '16px' }}>
            <label htmlFor="create-title" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent, #38bdf8)' }}>
              Canvas Title <span style={{ color: 'var(--red, #f87171)' }}>*</span>
            </label>
            <input
              id="create-title"
              autoComplete="off"
              placeholder="e.g. System Architecture Review"
              maxLength={40}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                borderColor: touched && !isTitleValid ? 'var(--red, #f87171)' : undefined,
              }}
            />
            {touched && !isTitleValid && (
              <span style={{ color: 'var(--red, #f87171)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Please enter a title for your canvas.
              </span>
            )}
          </div>

          {/* Display Name Field */}
          <div className="field" style={{ marginBottom: '16px' }}>
            <label htmlFor="create-name">Your Display Name</label>
            <input
              id="create-name"
              autoComplete="off"
              placeholder="e.g. Nova"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Room Code Preview Field */}
          <div className="field" style={{ marginBottom: '24px' }}>
            <label htmlFor="create-code">Room Code (Auto-assigned)</label>
            <div className="roomwrap">
              <span>#</span>
              <input
                id="create-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
                maxLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--surface-border, rgba(255,255,255,0.12))',
                color: 'var(--text-sub)',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                flex: 2,
                background: isSubmitDisabled
                  ? 'rgba(56, 189, 248, 0.2)'
                  : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                color: isSubmitDisabled ? 'rgba(255,255,255,0.4)' : '#070913',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 700,
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitDisabled ? 'none' : '0 8px 24px rgba(56, 189, 248, 0.3)',
              }}
            >
              {loading ? 'Creating...' : 'Create Canvas →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
