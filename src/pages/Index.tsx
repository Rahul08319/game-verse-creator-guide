
import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from '../components/GameCanvas';
import GameUI from '../components/GameUI';
import { GameState, Bubble, Position } from '../types/gameTypes';
import { initializeGame, updateGameState, checkGameOver } from '../utils/gameLogic';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    bubbles: [],
    currentBubble: null,
    nextBubble: null,
    score: 0,
    level: 1,
    lives: 3,
    isGameOver: false,
    isPaused: false
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [isAiming, setIsAiming] = useState(false);

  useEffect(() => {
    // Initialize game
    const initialState = initializeGame();
    setGameState(initialState);
  }, []);

  const handleShoot = useCallback((angle: number) => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentBubble) return;

    const newState = updateGameState(gameState, angle);
    setGameState(newState);

    // Check for game over
    if (checkGameOver(newState)) {
      setGameState(prev => ({ ...prev, isGameOver: true }));
    }
  }, [gameState]);

  const handleRestart = () => {
    const initialState = initializeGame();
    setGameState(initialState);
  };

  const handlePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 max-w-md w-full">
        <GameUI 
          gameState={gameState}
          onRestart={handleRestart}
          onPause={handlePause}
        />
        
        <div className="relative mt-4">
          <GameCanvas
            ref={canvasRef}
            gameState={gameState}
            aimAngle={aimAngle}
            onShoot={handleShoot}
            onAimChange={setAimAngle}
            onAimingChange={setIsAiming}
          />
        </div>

        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
              <p className="text-xl text-gray-600 mb-2">Final Score: {gameState.score}</p>
              <p className="text-lg text-gray-500 mb-6">Level: {gameState.level}</p>
              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
