
import React, { useState, useEffect } from 'react';
import { Achievement } from '../utils/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDone: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDone }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50);
    const t2 = setTimeout(() => setPhase('exit'), 3000);
    const t3 = setTimeout(() => onDone(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-500 ${
        phase === 'enter' ? 'opacity-0 -translate-y-8 scale-90' :
        phase === 'exit' ? 'opacity-0 translate-y-4 scale-95' :
        'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-900/90 via-amber-900/90 to-yellow-900/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-yellow-500/40 shadow-2xl shadow-yellow-500/20 flex items-center gap-3 min-w-[240px]">
        {/* Icon with glow */}
        <div className="relative">
          <div className="text-3xl animate-bounce">{achievement.icon}</div>
          <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl" />
        </div>
        
        <div className="flex-1">
          <div className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-widest">Achievement Unlocked!</div>
          <div className="text-white font-bold text-sm">{achievement.title}</div>
          <div className="text-yellow-200/60 text-[10px]">{achievement.description}</div>
        </div>

        {/* Sparkle effect */}
        <div className="text-yellow-400 animate-pulse text-lg">✦</div>
      </div>
    </div>
  );
};

export default AchievementToast;
