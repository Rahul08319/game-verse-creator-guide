
import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from '../components/GameCanvas';
import GameUI from '../components/GameUI';
import { GameState } from '../types/gameTypes';
import { initializeGame, updateGameState, checkGameOver, updateParticles, updateComboTexts, getTargetScore } from '../utils/gameLogic';
import { SoundManager } from '../utils/soundManager';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [showLevelUp, setShowLevelUp] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const gameLoopRef = useRef<number>();

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Init audio on first interaction
  useEffect(() => {
    const initAudio = () => {
      SoundManager.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Game loop for particles and freeze timer
  useEffect(() => {
    const gameLoop = () => {
      setGameState(prev => {
        let newState = { ...prev };
        if (prev.particles && prev.particles.length > 0) {
          newState.particles = updateParticles(prev.particles);
        }
        if (prev.comboTexts && prev.comboTexts.length > 0) {
          newState.comboTexts = updateComboTexts(prev.comboTexts);
        }
        if (prev.isFrozen && prev.frozenTimer > 0) {
          newState.frozenTimer = prev.frozenTimer - 1;
          if (newState.frozenTimer <= 0) newState.isFrozen = false;
        }
        return newState;
      });
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, []);

  const handleShoot = useCallback((angle: number) => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentBubble) return;

    SoundManager.shoot();
    const newState = updateGameState(gameState, angle);

    // Play sound effects based on event
    if (newState.soundEvent) {
      const evt = newState.soundEvent;
      if (evt === 'bomb') SoundManager.bomb();
      else if (evt === 'freeze') SoundManager.freeze();
      else if (evt === 'rainbow') SoundManager.rainbow();
      else if (evt === 'pop') SoundManager.multiPop(3);
      else if (evt.startsWith('combo-')) {
        const comboLevel = parseInt(evt.split('-')[1]);
        SoundManager.combo(comboLevel);
        SoundManager.multiPop(comboLevel + 2);
      } else if (evt === 'attach') SoundManager.attach();
    }

    // Check level complete
    if (newState.levelComplete) {
      SoundManager.levelUp();
      setShowLevelUp(true);
      setGameState(newState);
      setTimeout(() => {
        setShowLevelUp(false);
        const nextLevel = newState.level + 1;
        setGameState(initializeGame(nextLevel, newState.score));
      }, 2000);
      return;
    }

    setGameState(newState);

    if (checkGameOver(newState)) {
      SoundManager.gameOver();
      setGameState(prev => ({ ...prev, isGameOver: true }));
    }
  }, [gameState]);

  const handleRestart = () => {
    setGameState(initializeGame());
    setShowLevelUp(false);
  };

  const handlePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const isLandscape = orientation === 'landscape';
  const targetScore = getTargetScore(gameState.level);
  const progress = Math.min(100, Math.floor((gameState.score / targetScore) * 100));

  return (
    <div className={`min-h-screen bg-[#0a0a1a] flex items-center justify-center p-2 sm:p-4 overflow-hidden ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 ${
        isLandscape 
          ? 'flex flex-row p-4 gap-4 max-h-[95vh] aspect-video max-w-[95vw]'
          : 'flex flex-col p-4 sm:p-6 max-w-md w-full aspect-[9/16] max-h-[95vh]'
      }`}>
        {/* Neon border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-xl -z-10" />

        {/* Side panel in landscape / top panel in portrait */}
        <div className={`flex flex-col ${isLandscape ? 'w-48 justify-between shrink-0' : ''}`}>
          <GameUI
            gameState={gameState}
            onRestart={handleRestart}
            onPause={handlePause}
          />

          {/* Level progress bar */}
          <div className={`${isLandscape ? 'mt-4' : 'mt-2'}`}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-purple-400 font-bold">Level {gameState.level}</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-center">
              Target: {targetScore.toLocaleString()}
            </div>
          </div>

          {/* Power-up legend */}
          <div className={`flex gap-3 text-xs ${isLandscape ? 'flex-col mt-4' : 'justify-center mt-2'}`}>
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
        </div>

        {/* Game canvas */}
        <div className={`relative flex justify-center items-center ${isLandscape ? 'flex-1' : 'mt-2 flex-1'}`}>
          <GameCanvas
            ref={canvasRef}
            gameState={gameState}
            aimAngle={aimAngle}
            onShoot={handleShoot}
            onAimChange={setAimAngle}
            onAimingChange={() => {}}
          />
        </div>

        {/* Level Up overlay */}
        {showLevelUp && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
            <div className="text-center animate-bounce">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 mb-2">
                LEVEL UP!
              </h2>
              <p className="text-xl text-yellow-300">Level {gameState.level + 1}</p>
              <p className="text-sm text-gray-400 mt-2">Get ready...</p>
            </div>
          </div>
        )}

        {/* Game Over overlay */}
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-xl animate-bounce z-30">
          Combo x{gameState.combo}!
        </div>
      )}
    </div>
  );
};

export default Index;
