import React from 'react';
import { motion } from 'motion/react';
import { easings } from '../lib/animation';

export const BrandTitle: React.FC = () => {
  return (
    <div className="hero-brand-title">
      <motion.span
        className="hero-brand-title-word"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easings.spring, delay: 0.3 }}
      >
        Orbit
      </motion.span>
      <motion.span
        className="hero-brand-title-word"
        style={{ color: 'var(--accent)' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easings.spring, delay: 0.4 }}
      >
        Canvas
      </motion.span>
      <motion.span
        className="beta-badge"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: easings.spring, delay: 0.55 }}
      >
        BETA
      </motion.span>
    </div>
  );
};
