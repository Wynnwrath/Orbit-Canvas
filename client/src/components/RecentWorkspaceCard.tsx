import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { easings, durations } from '../lib/animation';

interface RecentWorkspaceCardProps {
  code: string;
  title: string;
  savedName: string;
  delay?: number;
}

export const RecentWorkspaceCard: React.FC<RecentWorkspaceCardProps> = ({
  code,
  title,
  savedName,
  delay = 0.7,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="recent-workspace-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.normal, ease: easings.spring, delay }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="rw-info">
        <div className="rw-label">Continue Recent Workspace</div>
        <div className="rw-title">{title}</div>
        <div className="rw-code">#{code}</div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => navigate(`/canvas/${code}?name=${encodeURIComponent(savedName || 'Nova')}`)}
        style={{
          padding: '8px 14px',
          fontSize: '12.5px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 12px rgba(34, 211, 238, 0.2)',
        }}
      >
        Resume
      </button>
    </motion.div>
  );
};
