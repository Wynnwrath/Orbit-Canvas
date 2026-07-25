import React from 'react';
import { motion } from 'motion/react';
import { easings } from '../lib/animation';

export const OrbitalCanvas: React.FC = () => {
  return (
    <div className="orbital-container">
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 320 320"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: easings.spring, delay: 0.1 }}
        style={{ willChange: 'transform' }}
      >
        {/* Orbit Ring 1 */}
        <motion.ellipse
          cx="160" cy="160" rx="130" ry="48"
          fill="none"
          stroke="rgba(34, 211, 238, 0.18)"
          strokeWidth="1"
          transform="rotate(-28 160 160)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: easings.smooth, delay: 0.3 }}
        />

        {/* Orbit Ring 2 */}
        <motion.ellipse
          cx="160" cy="160" rx="130" ry="48"
          fill="none"
          stroke="rgba(34, 211, 238, 0.12)"
          strokeWidth="1"
          transform="rotate(-72 160 160)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: easings.smooth, delay: 0.45 }}
        />

        {/* Orbit Ring 3 */}
        <motion.ellipse
          cx="160" cy="160" rx="130" ry="48"
          fill="none"
          stroke="rgba(168, 85, 247, 0.15)"
          strokeWidth="1"
          transform="rotate(52 160 160)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: easings.smooth, delay: 0.55 }}
        />

        {/* Core dot */}
        <motion.circle
          cx="160" cy="160" r="5"
          fill="var(--accent)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: easings.spring, delay: 0.2 }}
        />

        {/* Core glow */}
        <motion.circle
          cx="160" cy="160" r="24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.5"
          opacity={0.3}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Electron 1 (outer ring, rotates around) */}
        <motion.circle
          cx="160" cy="112"
          r="3.5"
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        />

        {/* Electron 2 */}
        <motion.circle
          cx="255" cy="160"
          r="2.8"
          fill="var(--accent)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        />

        {/* Electron 3 */}
        <motion.circle
          cx="160" cy="208"
          r="2.5"
          fill="rgba(168, 85, 247, 0.9)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.3 }}
        />
      </motion.svg>
    </div>
  );
};
