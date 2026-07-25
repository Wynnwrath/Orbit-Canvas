import React from 'react';
import { OrbitalCanvas } from './OrbitalCanvas';
import { BrandTitle } from './BrandTitle';
import { HeroTagline } from './HeroTagline';
import { FeaturePills } from './FeaturePills';

export const OrbitalHero: React.FC = () => {
  return (
    <div className="join-hero-left">
      <OrbitalCanvas />
      <BrandTitle />
      <HeroTagline />
      <FeaturePills />
    </div>
  );
};
