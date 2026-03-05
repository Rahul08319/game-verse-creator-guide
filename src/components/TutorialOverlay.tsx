
import React from 'react';

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-[90%] max-w-xs max-h-[90%] overflow-auto border border-purple-500/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-center mb-4">
          How to Play
        </h2>

        {/* Controls */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-white text-sm font-semibold">Aim & Shoot</p>
              <p className="text-gray-400 text-xs">Move mouse or drag on screen to aim. Click or release to shoot bubbles.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-2xl">🔮</span>
            <div>
              <p className="text-white text-sm font-semibold">Match 3+</p>
              <p className="text-gray-400 text-xs">Connect 3 or more same-colored bubbles to pop them and score points!</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-2xl">⬆️</span>
            <div>
              <p className="text-white text-sm font-semibold">Level Up</p>
              <p className="text-gray-400 text-xs">Reach the target score to advance. Each level has unique patterns and more colors.</p>
            </div>
          </div>
        </div>

        {/* Power-ups */}
        <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Power-Ups</h3>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-3 bg-orange-500/10 rounded-lg p-2 border border-orange-500/20">
            <span className="text-xl">💣</span>
            <div>
              <p className="text-orange-300 text-xs font-bold">Bomb</p>
              <p className="text-gray-400 text-[10px]">Explodes nearby bubbles in a big radius!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/20">
            <span className="text-xl">❄️</span>
            <div>
              <p className="text-cyan-300 text-xs font-bold">Freeze</p>
              <p className="text-gray-400 text-[10px]">Freezes the board for a few seconds.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
            <span className="text-xl">🌈</span>
            <div>
              <p className="text-purple-300 text-xs font-bold">Rainbow</p>
              <p className="text-gray-400 text-[10px]">Matches the most common neighboring color!</p>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white py-3 rounded-full font-bold text-sm hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
        >
          Let's Play! 🚀
        </button>
      </div>
    </div>
  );
};

export default TutorialOverlay;
