import React, { useEffect, useState } from 'react';

interface LevelUpOverlayProps {
  level: number;
}

const LEVEL_TITLES: Record<number, string> = {
  2: 'Rising Star',
  3: 'Bubble Buster',
  4: 'Pop Master',
  5: 'Chain Breaker',
  6: 'Color Wizard',
  7: 'Blast King',
  8: 'Neon Fury',
  9: 'Supreme Popper',
  10: 'Legendary',
};

const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ level }) => {
  const [phase, setPhase] = useState<'flash' | 'announce' | 'ready'>('flash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('announce'), 300);
    const t2 = setTimeout(() => setPhase('ready'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const title = LEVEL_TITLES[level] || `Stage ${level}`;

  return (
    <div className="absolute inset-0 rounded-3xl z-20 flex items-center justify-center overflow-hidden">
      {/* Flash */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: phase === 'flash' ? 1 : 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(139,92,246,0.4) 60%, transparent 100%)',
        }}
      />

      {/* Bg */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === 'flash' ? 0 : 1, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />

      {/* Radiating rings */}
      {phase !== 'flash' && (
        <>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-purple-400/30"
              style={{
                width: '100px',
                height: '100px',
                animation: `levelup-ring 1.5s ease-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* Content */}
      <div className="relative text-center z-10">
        {/* Level number */}
        <div
          className="transition-all duration-500"
          style={{
            opacity: phase === 'flash' ? 0 : 1,
            transform: phase === 'announce' ? 'scale(1)' : phase === 'ready' ? 'scale(0.8) translateY(-10px)' : 'scale(3)',
          }}
        >
          <div
            className="text-7xl font-black mb-1"
            style={{
              background: 'linear-gradient(135deg, #facc15, #f472b6, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.8))',
            }}
          >
            {level}
          </div>
        </div>

        {/* LEVEL UP text */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: phase !== 'flash' ? 1 : 0,
            transform: phase !== 'flash' ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <h2
            className="text-3xl font-black tracking-widest mb-2"
            style={{
              background: 'linear-gradient(90deg, #facc15, #f472b6, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'levelup-shimmer 1s ease-in-out infinite alternate',
            }}
          >
            LEVEL UP!
          </h2>
          <p className="text-lg text-purple-300 font-bold italic">{title}</p>
        </div>

        {/* Get ready */}
        <div
          className="mt-4 transition-all duration-500"
          style={{
            opacity: phase === 'ready' ? 1 : 0,
            transform: phase === 'ready' ? 'translateY(0)' : 'translateY(10px)',
          }}
        >
          <p className="text-sm text-gray-400 animate-pulse">Get ready...</p>
        </div>

        {/* Sparkle particles */}
        {phase !== 'flash' && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const dist = 80 + Math.random() * 40;
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                    top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                    background: ['#facc15', '#f472b6', '#818cf8', '#22d3ee'][i % 4],
                    animation: `levelup-sparkle 1s ease-out ${i * 0.08}s infinite`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes levelup-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(6); opacity: 0; }
        }
        @keyframes levelup-shimmer {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.4); }
        }
        @keyframes levelup-sparkle {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LevelUpOverlay;
