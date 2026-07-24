import React, { useEffect, useState } from 'react';

interface HintBarProps {
  mode: 'idle' | 'pen' | 'lasso';
}

export const HintBar: React.FC<HintBarProps> = ({ mode }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      if (mode === 'idle') {
        setVisible(false);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [mode]);

  const getHintText = () => {
    if (mode === 'pen') return 'Pen armed — drag to draw. Esc to stop.';
    if (mode === 'lasso') return 'Lasso armed — drag a box around content.';
    return 'Right-click anywhere for tools · Drag cards by their header · Esc exits a tool';
  };

  return (
    <div
      className="hint"
      id="hint"
      data-od-id="canvas-hint"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {getHintText()}
    </div>
  );
};
