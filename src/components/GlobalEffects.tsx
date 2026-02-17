import React from 'react';
import BackgroundGif from './BackgroundGif';
import ParticleNetwork from './ParticleNetwork';

interface GlobalEffectsProps {
    opacity?: number;
    showParticles?: boolean;
}

const GlobalEffects: React.FC<GlobalEffectsProps> = ({ opacity = 0.08, showParticles = true }) => {
    return (
        <>
            <BackgroundGif opacity={opacity} />
            {showParticles && <ParticleNetwork opacity={0.15} />}
        </>
    );
};

export default GlobalEffects;
