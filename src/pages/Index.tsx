
import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from '../components/GameCanvas';
import GameUI from '../components/GameUI';
import { GameState } from '../types/gameTypes';
import { initializeGame, updateGameState, checkGameOver, updateParticles, updateComboTexts } from '../utils/gameLogic';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const gameLoopRef = useRef<number>();

  // Game loop for particles and freeze timer
  useEffect(() => {
    const gameLoop = () => {
      setGameState(prev => {
        let newState = { ...prev };
        
        // Update particles
        if (prev.particles.length > 0) {
          newState.particles = updateParticles(prev.particles);
        }
        
        // Update combo texts
        if (prev.comboTexts.length > 0) {
          newState.comboTexts = updateComboTexts(prev.comboTexts);
        }
        
        // Update freeze timer
        if (prev.isFrozen && prev.frozenTimer > 0) {
          newState.frozenTimer = prev.frozenTimer - 1;
          if (newState.frozenTimer <= 0) {
            newState.isFrozen = false;
          }
        }
        
        return newState;
      });
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
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
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 max-w-md w-full border border-white/10">
        {/* Neon border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-xl -z-10" />
        
        <GameUI 
          gameState={gameState}
          onRestart={handleRestart}
          onPause={handlePause}
        />
        
        <div className="relative mt-4 flex justify-center">
          <GameCanvas
            ref={canvasRef}
            gameState={gameState}
            aimAngle={aimAngle}
            onShoot={handleShoot}
            onAimChange={setAimAngle}
            onAimingChange={() => {}}
          />
        </div>

        {/* Power-up legend */}
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-orange-400">
            <span>💣</span> Bomb
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span>❄️</span> Freeze
          </div>
          <div className="flex items-center gap-1 text-white">
            <span>🌈</span> Rainbow
          </div>
        </div>

        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl p-8 text-center shadow-xl border border-pink-500/30">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-4">
                Game Over!
              </h2>
              <p className="text-2xl text-white mb-2">Score: {gameState.score}</p>
              <p className="text-lg text-gray-400 mb-6">Level: {gameState.level}</p>
              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Combo display */}
      {gameState.combo >= 2 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-xl animate-bounce">
          Combo x{gameState.combo}!
        </div>
      )}
    </div>
  );
};

export default Index;
