import React from 'react';
import BackgroundGif from './BackgroundGif';
import ParticleNetwork from './ParticleNetwork';

interface GlobalEffectsProps {
    opacity?: number;
}

const GlobalEffects: React.FC<GlobalEffectsProps> = ({ opacity = 0.08 }) => {
    return (
        <>
            <BackgroundGif opacity={opacity} />
            <ParticleNetwork opacity={0.15} />
        </>
    );
};

export default GlobalEffects;
