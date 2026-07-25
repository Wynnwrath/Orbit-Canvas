import React from 'react';
import { motion } from 'motion/react';
import { Code, Users, Sparkle } from '@phosphor-icons/react';
import { easings } from '../lib/animation';
import { cn } from '../lib/utils';

interface Pill {
  icon: React.ReactNode;
  label: string;
  delay: number;
  floatOffset: number;
}

const pills: Pill[] = [
  {
    icon: <Code size={16} weight="regular" />,
    label: 'Code Cards',
    delay: 0.6,
    floatOffset: 0,
  },
  {
    icon: <Users size={16} weight="regular" />,
    label: 'Collaborate',
    delay: 0.7,
    floatOffset: 0.5,
  },
  {
    icon: <Sparkle size={16} weight="regular" />,
    label: 'AI Tutor',
    delay: 0.8,
    floatOffset: 1,
  },
];

export const FeaturePills: React.FC = () => {
  return (
    <div className="feature-pills">
      {pills.map((pill) => (
        <motion.div
          key={pill.label}
          className={cn('feature-pill', 'glass-subtle')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: easings.spring,
            delay: pill.delay,
          }}
          whileHover={{ scale: 1.05 }}
        >
          {pill.icon}
          {pill.label}
        </motion.div>
      ))}
    </div>
  );
};
