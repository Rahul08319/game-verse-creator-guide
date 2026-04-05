
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas';
import GameUI from '../components/GameUI';
import TutorialOverlay from '../components/TutorialOverlay';
import SettingsOverlay, { GameSettings } from '../components/SettingsOverlay';
import DailyChallengeOverlay from '../components/DailyChallengeOverlay';
import AchievementToast from '../components/AchievementToast';
import AchievementsOverlay from '../components/AchievementsOverlay';
import MultiplayerOverlay from '../components/MultiplayerOverlay';
import MultiplayerScoreboard from '../components/MultiplayerScoreboard';
import MultiplayerResults from '../components/MultiplayerResults';
import EmojiReactions from '../components/EmojiReactions';
import { GameState } from '../types/gameTypes';
import { initializeGame, updateGameState, checkGameOver, updateParticles, updateComboTexts, getTargetScore, setDifficulty, setTheme } from '../utils/gameLogic';
import { SoundManager } from '../utils/soundManager';
import { getHighScores, getGlobalHighScores, saveHighScore, isHighScore, HighScore } from '../utils/highScores';
import { saveDailyResult } from '../utils/dailyChallenge';
import { checkAchievements, Achievement } from '../utils/achievements';
import { YouTubePlayables } from '../utils/youtubePlayables';
import { MultiplayerSession, MultiplayerPlayer, updateScore, getPlayers, subscribeToPlayers, resetSessionForRematch } from '../utils/multiplayer';
import { Haptics } from '../utils/haptics';

const Index = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>(() => getHighScores());
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('bubble-pop-tutorial-seen');
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [mpSession, setMpSession] = useState<MultiplayerSession | null>(null);
  const [mpPlayers, setMpPlayers] = useState<MultiplayerPlayer[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('bubble-pop-settings');
    const s = saved ? JSON.parse(saved) : { difficulty: 'normal', volume: 80, theme: 'neon' };
    setDifficulty(s.difficulty);
    setTheme(s.theme);
    return s;
  });

  const [mpTimeLeft, setMpTimeLeft] = useState<number | null>(null);
  const [showMpResults, setShowMpResults] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);
  const mpTimerRef = useRef<ReturnType<typeof setInterval>>();

  const MATCH_DURATION = 120; // seconds

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const gameLoopRef = useRef<number>();
  const shakeRef = useRef<number>();

  const triggerScreenShake = useCallback((intensity: number = 8, duration: number = 300) => {
    const startTime = Date.now();
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        setScreenShake({ x: 0, y: 0 });
        return;
      }
      const decay = 1 - elapsed / duration;
      const x = (Math.random() - 0.5) * 2 * intensity * decay;
      const y = (Math.random() - 0.5) * 2 * intensity * decay;
      setScreenShake({ x, y });
      shakeRef.current = requestAnimationFrame(shake);
    };
    shake();
  }, []);

  const queueAchievements = useCallback((newState: GameState, soundEvent?: string) => {
    const { newlyUnlocked } = checkAchievements({
      soundEvent,
      combo: newState.combo,
      level: newState.level,
      score: newState.score,
      bubblesLeft: newState.bubbles.length,
      isDailyMode,
      isGameOver: newState.isGameOver,
    });
    if (newlyUnlocked.length > 0) {
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, [isDailyMode]);

  useEffect(() => {
    YouTubePlayables.init({
      onPause: () => setGameState(prev => ({ ...prev, isPaused: true })),
      onResume: () => setGameState(prev => ({ ...prev, isPaused: false })),
    });
    setTimeout(() => {
      YouTubePlayables.firstFrameReady();
      YouTubePlayables.gameReady();
    }, 500);
  }, []);

  useEffect(() => {
    const check = () => setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const initAudio = () => {
      SoundManager.init();
      SoundManager.setVolume(gameSettings.volume / 100);
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

  // Multiplayer realtime subscription
  useEffect(() => {
    if (!mpSession) return;
    getPlayers(mpSession.sessionId).then(setMpPlayers);
    const unsub = subscribeToPlayers(mpSession.sessionId, setMpPlayers);
    return unsub;
  }, [mpSession]);

  // Multiplayer countdown timer
  useEffect(() => {
    if (mpTimeLeft === null || !mpSession) return;
    if (mpTimeLeft <= 0) {
      // Time's up — end game
      setGameState(prev => {
        if (prev.isGameOver) return prev;
        const finalState = { ...prev, isGameOver: true };
        updateScore(mpSession.sessionId, finalState.score, finalState.level, true);
        SoundManager.gameOver();
        return finalState;
      });
      setShowMpResults(true);
      return;
    }
    mpTimerRef.current = setInterval(() => {
      setMpTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => { if (mpTimerRef.current) clearInterval(mpTimerRef.current); };
  }, [mpTimeLeft === null, mpTimeLeft === 0, mpSession]);

  useEffect(() => {
    const gameLoop = () => {
      setGameState(prev => {
        let newState = { ...prev };
        if (prev.particles && prev.particles.length > 0) newState.particles = updateParticles(prev.particles);
        if (prev.comboTexts && prev.comboTexts.length > 0) newState.comboTexts = updateComboTexts(prev.comboTexts);
        if (prev.isFrozen && prev.frozenTimer > 0) {
          newState.frozenTimer = prev.frozenTimer - 1;
          if (newState.frozenTimer <= 0) newState.isFrozen = false;
        }
        return newState;
      });
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (shakeRef.current) cancelAnimationFrame(shakeRef.current);
    };
  }, []);

  const handleShoot = useCallback((angle: number) => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentBubble) return;
    SoundManager.shoot();
    Haptics.shoot();
    const newState = updateGameState(gameState, angle);

    if (newState.soundEvent) {
      const evt = newState.soundEvent;
      if (evt === 'bomb') {
        SoundManager.bomb();
        Haptics.explosion();
        triggerScreenShake(12, 400);
      }
      else if (evt === 'freeze') SoundManager.freeze();
      else if (evt === 'rainbow') SoundManager.rainbow();
      else if (evt === 'pop') { SoundManager.multiPop(3); Haptics.pop(); }
      else if (evt.startsWith('combo-')) {
        const comboLevel = parseInt(evt.split('-')[1]);
        SoundManager.combo(comboLevel);
        SoundManager.multiPop(comboLevel + 2);
        Haptics.combo(comboLevel);
        if (comboLevel >= 3) triggerScreenShake(4, 200);
      } else if (evt === 'attach') SoundManager.attach();
    }

    // Check achievements after each shot
    queueAchievements(newState, newState.soundEvent);

    if (newState.levelComplete) {
      SoundManager.levelUp();
      Haptics.levelUp();
      YouTubePlayables.sendScore(newState.score);
      setShowLevelUp(true);
      const nextLevel = newState.level + 1;
      setGameState(newState);
      // Check level achievements
      queueAchievements({ ...newState, level: nextLevel }, undefined);
      setTimeout(() => {
        setShowLevelUp(false);
        setGameState(initializeGame(nextLevel, newState.score, isDailyMode));
      }, 2000);
      return;
    }

    setGameState(newState);
    // Update multiplayer score
    if (mpSession) updateScore(mpSession.sessionId, newState.score, newState.level, false);
    if (checkGameOver(newState)) {
      SoundManager.gameOver();
      Haptics.gameOver();
      YouTubePlayables.sendScore(newState.score);
      const finalState = { ...newState, isGameOver: true };
      setGameState(finalState);
      if (mpSession) {
        updateScore(mpSession.sessionId, finalState.score, finalState.level, true);
        setShowMpResults(true);
      }
      queueAchievements(finalState, undefined);
      if (isDailyMode) {
        saveDailyResult(newState.score, newState.level, playerName || 'Player');
      }
      if (isHighScore(newState.score)) {
        setShowNameInput(true);
      }
    }
  }, [gameState, triggerScreenShake, isDailyMode, playerName, queueAchievements, mpSession]);

  const handleRestart = () => {
    setIsDailyMode(false);
    setMpSession(null);
    setMpPlayers([]);
    setMpTimeLeft(null);
    setShowMpResults(false);
    if (mpTimerRef.current) clearInterval(mpTimerRef.current);
    setGameState(initializeGame());
    setShowLevelUp(false);
    setShowNameInput(false);
  };

  const handleRematch = useCallback(async () => {
    if (!mpSession) return;
    setRematchLoading(true);
    const newSeed = await resetSessionForRematch(mpSession.sessionId);
    setRematchLoading(false);
    if (newSeed === null) return;
    setShowMpResults(false);
    setGameState(initializeGame(1, 0, false));
    setMpTimeLeft(MATCH_DURATION);
  }, [mpSession]);

  const handleStartMultiplayer = useCallback((session: MultiplayerSession) => {
    setMpSession(session);
    setShowMultiplayer(false);
    setGameState(initializeGame(1, 0, false));
    setMpTimeLeft(MATCH_DURATION);
  }, []);

  const handleStartDaily = () => {
    setIsDailyMode(true);
    setShowDailyChallenge(false);
    setGameState(initializeGame(1, 0, true));
    setShowLevelUp(false);
    setShowNameInput(false);
  };

  const handlePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleToggleMute = () => {
    const muted = SoundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleSaveSettings = (s: GameSettings) => {
    setGameSettings(s);
    localStorage.setItem('bubble-pop-settings', JSON.stringify(s));
    setDifficulty(s.difficulty);
    setTheme(s.theme);
    SoundManager.setVolume(s.volume / 100);
    setShowSettings(false);
    setGameState(initializeGame(1, 0, isDailyMode));
  };

  const handleSaveScore = async () => {
    const name = playerName.trim() || 'Player';
    const updated = await saveHighScore(gameState.score, gameState.level, name);
    setHighScores(updated);
    if (isDailyMode) {
      saveDailyResult(gameState.score, gameState.level, name);
    }
    setShowNameInput(false);
    setPlayerName('');
  };

  const isLandscape = orientation === 'landscape';
  const targetScore = getTargetScore(gameState.level);
  const progress = Math.min(100, Math.floor((gameState.score / targetScore) * 100));

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-2 overflow-hidden">
      {/* Achievement toast */}
      {achievementQueue.length > 0 && (
        <AchievementToast
          key={achievementQueue[0].id}
          achievement={achievementQueue[0]}
          onDone={() => setAchievementQueue(prev => prev.slice(1))}
        />
      )}

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main game container */}
      <div className={`relative bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden ${
        isLandscape
          ? 'flex flex-row w-[min(95vw,95vh*16/9)] h-[min(95vh,95vw*9/16)] p-3 gap-3'
          : 'flex flex-col w-[min(95vw,95vh*9/16)] h-[min(95vh,95vw*16/9)] p-3'
      }`}>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-xl -z-10" />

        {/* Side/Top panel */}
        <div className={`flex flex-col ${isLandscape ? 'w-52 shrink-0 justify-between' : 'shrink-0'}`}>
          <GameUI gameState={gameState} onRestart={handleRestart} onPause={handlePause} />

          {isDailyMode && (
            <div className="mt-1 text-center">
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">
                📅 DAILY CHALLENGE
              </span>
            </div>
          )}

          {/* Level progress */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-purple-400 font-bold">Level {gameState.level}</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-center">Target: {targetScore.toLocaleString()}</div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex gap-2 text-[10px]">
              <span className="text-orange-400">💣</span>
              <span className="text-cyan-400">❄️</span>
              <span>🌈</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleToggleMute}
                className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 transition-all border border-white/10"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={async () => { setShowLeaderboard(!showLeaderboard); setHighScores(await getGlobalHighScores()); }}
                className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 transition-all border border-white/10"
                title="Leaderboard"
              >
                🏆
              </button>
              <button
                onClick={() => setShowAchievements(true)}
                className="w-7 h-7 flex items-center justify-center bg-amber-500/20 text-white rounded-lg text-xs hover:bg-amber-500/30 transition-all border border-amber-500/20"
                title="Achievements"
              >
                🏅
              </button>
              <button
                onClick={() => setShowDailyChallenge(true)}
                className="w-7 h-7 flex items-center justify-center bg-yellow-500/20 text-white rounded-lg text-xs hover:bg-yellow-500/30 transition-all border border-yellow-500/20"
                title="Daily Challenge"
              >
                📅
              </button>
              <button
                onClick={() => setShowMultiplayer(true)}
                className="w-7 h-7 flex items-center justify-center bg-green-500/20 text-white rounded-lg text-xs hover:bg-green-500/30 transition-all border border-green-500/20"
                title="Multiplayer"
              >
                🎮
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 transition-all border border-white/10"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* Game canvas area */}
        <div className={`relative flex justify-center items-center ${isLandscape ? 'flex-1' : 'flex-1 mt-1'}`}>
          <GameCanvas
            ref={canvasRef}
            gameState={gameState}
            aimAngle={aimAngle}
            screenShake={screenShake}
            onShoot={handleShoot}
            onAimChange={setAimAngle}
            onAimingChange={() => {}}
          />
          {/* Multiplayer live scoreboard */}
          {mpSession && mpPlayers.length > 0 && (
            <MultiplayerScoreboard players={mpPlayers} timeLeft={mpTimeLeft} />
          )}
          {mpSession && !gameState.isGameOver && (
            <EmojiReactions sessionId={mpSession.sessionId} />
          )}
        </div>

        {/* Leaderboard overlay */}
        {showLeaderboard && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20 animate-fade-in">
            <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-6 w-72 max-h-[80%] overflow-auto border border-purple-500/30 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">🏆 High Scores</h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
              </div>
              {highScores.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-4">No scores yet. Play a game!</p>
              ) : (
                <div className="space-y-2">
                  {highScores.map((hs, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : i === 1 ? 'bg-gray-300/5 border border-gray-400/10' : i === 2 ? 'bg-orange-500/5 border border-orange-500/10' : 'bg-white/5'}`}>
                      <span className={`text-lg font-bold w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{hs.name}</div>
                        <div className="text-gray-500 text-[10px]">Lvl {hs.level} · {hs.date}</div>
                      </div>
                      <span className="text-cyan-400 font-bold text-sm">{hs.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/leaderboard')}
                className="mt-4 w-full py-2 text-sm text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
              >
                View Full Leaderboard →
              </button>
            </div>
          </div>
        )}

        {/* Level Up overlay */}
        {showLevelUp && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20 animate-scale-in">
            <div className="text-center animate-bounce">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 mb-2">LEVEL UP!</h2>
              <p className="text-xl text-yellow-300">Level {gameState.level + 1}</p>
              <p className="text-sm text-gray-400 mt-2">Get ready...</p>
            </div>
          </div>
        )}

        {/* Tutorial overlay */}
        {showTutorial && (
          <TutorialOverlay onDismiss={() => {
            setShowTutorial(false);
            localStorage.setItem('bubble-pop-tutorial-seen', 'true');
          }} />
        )}

        {/* Multiplayer Results overlay */}
        {showMpResults && mpPlayers.length > 0 && (
          <MultiplayerResults players={mpPlayers} onClose={handleRestart} onRematch={handleRematch} rematchLoading={rematchLoading} />
        )}

        {/* Game Over overlay (non-multiplayer) */}
        {gameState.isGameOver && !showMpResults && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 animate-fade-in">
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl p-6 text-center shadow-xl border border-pink-500/30 w-72">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-3">Game Over!</h2>
              {isDailyMode && (
                <p className="text-yellow-400 text-xs font-bold mb-1">📅 Daily Challenge</p>
              )}
              <p className="text-2xl text-white mb-1">{gameState.score.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mb-4">Level {gameState.level}</p>

              {showNameInput && (
                <div className="mb-4 space-y-2">
                  <p className="text-yellow-400 text-sm font-bold">🏆 New High Score!</p>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveScore()}
                    placeholder="Your name"
                    maxLength={12}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center text-sm outline-none focus:border-cyan-400 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveScore}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform"
                  >
                    Save Score
                  </button>
                </div>
              )}

              <div className="flex gap-2 mb-4 justify-center">
                <button onClick={() => shareScore(gameState.score, gameState.level, 'twitter')} className="px-3 py-1.5 bg-[#1da1f2]/20 hover:bg-[#1da1f2]/40 text-[#1da1f2] rounded-lg text-xs font-medium transition-all" title="Share on X">𝕏</button>
                <button onClick={() => shareScore(gameState.score, gameState.level, 'facebook')} className="px-3 py-1.5 bg-[#1877f2]/20 hover:bg-[#1877f2]/40 text-[#1877f2] rounded-lg text-xs font-medium transition-all" title="Share on Facebook">f</button>
                <button onClick={() => { shareScore(gameState.score, gameState.level, 'copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-xs font-medium transition-all" title="Copy to clipboard">{copied ? '✓' : '📋'}</button>
              </div>

              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Settings overlay */}
        {showSettings && (
          <SettingsOverlay
            settings={gameSettings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Daily Challenge overlay */}
        {showDailyChallenge && (
          <DailyChallengeOverlay
            onStart={handleStartDaily}
            onClose={() => setShowDailyChallenge(false)}
          />
        )}

        {/* Achievements overlay */}
        {showAchievements && (
          <AchievementsOverlay onClose={() => setShowAchievements(false)} />
        )}

        {/* Multiplayer overlay */}
        {showMultiplayer && (
          <MultiplayerOverlay
            onStart={handleStartMultiplayer}
            onClose={() => setShowMultiplayer(false)}
          />
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
