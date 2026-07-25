import React from 'react';
import { motion } from 'motion/react';
import { easings } from '../lib/animation';

export const HeroTagline: React.FC = () => {
  return (
    <div>
      <motion.p
        className="hero-tagline-primary"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easings.default, delay: 0.5 }}
      >
        Where code meets canvas.
      </motion.p>
      <motion.p
        className="hero-tagline-secondary"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easings.default, delay: 0.6 }}
      >
        A spatial whiteboard for diagrams, code cards, and AI-powered tutoring — shared live with your team.
      </motion.p>
    </div>
  );
};
