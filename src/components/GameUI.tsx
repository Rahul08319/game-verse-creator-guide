
import React from 'react';
import { GameState } from '../types/gameTypes';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
  onPause: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onRestart, onPause }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-white">
        <div className="text-lg font-bold">Score: {gameState.score}</div>
        <div className="text-sm opacity-80">Level: {gameState.level}</div>
      </div>
      
      <div className="text-white text-center">
        <div className="text-sm opacity-80">Lives</div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < gameState.lives ? 'bg-red-400' : 'bg-gray-400/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPause}
          className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
        >
          {gameState.isPaused ? '▶️' : '⏸️'}
        </button>
        <button
          onClick={onRestart}
          className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default GameUI;
