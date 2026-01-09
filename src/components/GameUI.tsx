
import React from 'react';
import { GameState } from '../types/gameTypes';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
  onPause: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onRestart, onPause }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-white">
        <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
          {gameState.score.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">Score</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-purple-400">Level {gameState.level}</div>
        <div className="flex gap-1 justify-center mt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < gameState.lives 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPause}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm text-white rounded-xl text-lg font-medium hover:bg-white/20 transition-all duration-200 border border-white/10 hover:border-white/30 hover:scale-110"
        >
          {gameState.isPaused ? '▶️' : '⏸️'}
        </button>
        <button
          onClick={onRestart}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm text-white rounded-xl text-lg font-medium hover:bg-white/20 transition-all duration-200 border border-white/10 hover:border-white/30 hover:scale-110"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default GameUI;
