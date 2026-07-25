import React from 'react';
import { X } from '@phosphor-icons/react';

export interface PenToolbarProps {
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClose: () => void;
}

export const PEN_COLORS = [
  { id: 'white', value: '#f4f4f5', label: 'Electric White' },
  { id: 'cyan', value: '#22d3ee', label: 'Cyber Cyan' },
  { id: 'purple', value: '#a855f7', label: 'Neon Purple' },
  { id: 'red', value: '#f43f5e', label: 'Coral Red' },
  { id: 'green', value: '#22c55e', label: 'Lime Green' },
  { id: 'yellow', value: '#eab308', label: 'Vivid Yellow' },
];

export const PEN_SIZES = [
  { value: 2, label: 'Fine (2px)' },
  { value: 4, label: 'Medium (4px)' },
  { value: 8, label: 'Thick (8px)' },
  { value: 16, label: 'Highlighter (16px)' },
];

export const PenToolbar: React.FC<PenToolbarProps> = ({
  color,
  width,
  onColorChange,
  onWidthChange,
  onClose,
}) => {
  return (
    <div
      className="pen-toolbar"
      data-od-id="pen-toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="pen-toolbar-section">
        <span className="pen-toolbar-label">Color</span>
        <div className="color-swatches">
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`color-swatch ${color === c.value ? 'active' : ''}`}
              style={{ backgroundColor: c.value }}
              title={c.label}
              onClick={() => onColorChange(c.value)}
            />
          ))}
        </div>
      </div>

      <div className="pen-toolbar-divider" />

      <div className="pen-toolbar-section">
        <span className="pen-toolbar-label">Size</span>
        <div className="size-pickers">
          {PEN_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`size-btn ${width === s.value ? 'active' : ''}`}
              title={s.label}
              onClick={() => onWidthChange(s.value)}
            >
              <span
                className="size-dot"
                style={{
                  width: `${Math.min(s.value, 12)}px`,
                  height: `${Math.min(s.value, 12)}px`,
                  backgroundColor: color,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="pen-toolbar-divider" />

      <button
        type="button"
        className="pen-close-btn"
        onClick={onClose}
        title="Close Pen (Esc)"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
};
