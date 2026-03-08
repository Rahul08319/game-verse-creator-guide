
import React from 'react';
import { getAllAchievements, getUnlockedCount, getTotalCount } from '../utils/achievements';

interface AchievementsOverlayProps {
  onClose: () => void;
}

const AchievementsOverlay: React.FC<AchievementsOverlayProps> = ({ onClose }) => {
  const achievements = getAllAchievements();
  const unlocked = getUnlockedCount();
  const total = getTotalCount();

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-[90%] max-w-xs max-h-[90%] overflow-auto border border-yellow-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500">
            🏅 Achievements
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-yellow-400 font-bold">{unlocked}/{total}</span>
            <span className="text-gray-400">{Math.round((unlocked / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(unlocked / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                a.unlockedAt
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-white/5 border-white/5 opacity-50 grayscale'
              }`}
            >
              <span className="text-2xl w-8 text-center">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${a.unlockedAt ? 'text-white' : 'text-gray-400'}`}>
                  {a.title}
                </div>
                <div className="text-[10px] text-gray-500">{a.description}</div>
              </div>
              {a.unlockedAt && (
                <span className="text-yellow-400 text-sm">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsOverlay;
