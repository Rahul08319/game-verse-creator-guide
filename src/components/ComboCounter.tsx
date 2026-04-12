import React from 'react';

interface ComboCounterProps {
  combo: number;
}

const ComboCounter: React.FC<ComboCounterProps> = ({ combo }) => {
  if (combo < 2) return null;

  const multiplier = Math.min(1 + combo * 0.5, 5);
  const intensity = Math.min(combo, 10);

  return (
    <div className="flex flex-col items-center gap-0.5 animate-bounce">
      <div
        className="text-center font-black tracking-tight"
        style={{
          fontSize: `${Math.min(14 + combo * 2, 28)}px`,
          background: `linear-gradient(135deg, #f472b6, #818cf8, #22d3ee)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 ${intensity * 2}px rgba(139, 92, 246, 0.6))`,
        }}
      >
        {combo}x COMBO
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-yellow-400 font-bold">×{multiplier.toFixed(1)}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(combo, 8) }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-cyan-400"
              style={{ opacity: 1 - i * 0.1, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComboCounter;
