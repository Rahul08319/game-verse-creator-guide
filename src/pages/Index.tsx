
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas';
import GameUI from '../components/GameUI';
import type { GameSettings } from '../components/SettingsOverlay';
import EmojiReactions from '../components/EmojiReactions';
import PowerUpIndicators from '../components/PowerUpIndicators';
import ComboCounter from '../components/ComboCounter';
import StreakBadge from '../components/StreakBadge';
import { toast } from 'sonner';
import { checkInDailyStreak, consumePendingReward, peekPendingReward, getStreak, StreakReward } from '../utils/dailyStreak';
import { GameState } from '../types/gameTypes';
import { initializeGame, updateGameState, applyAdaptiveDifficulty, checkGameOver, updateParticles, updateComboTexts, getTargetScore, setDifficulty, setTheme, setColorBlindMode, setParticleStyle } from '../utils/gameLogic';
import { SoundManager } from '../utils/soundManager';
import { getHighScores, getGlobalHighScores, saveHighScore, isHighScore, HighScore } from '../utils/highScores';
import { saveDailyResult } from '../utils/dailyChallenge';
import { saveWeeklyResult } from '../utils/weeklyChallenge';
import { getWeeklyGhost, saveWeeklyGhost, type GhostShot, type WeeklyGhostRun } from '../utils/weeklyGhost';
import { recordShot, recordCompletedGame } from '../utils/playerProgress';
import { checkAchievements } from '../utils/achievements';
import type { Achievement } from '../utils/achievements';
import { YouTubePlayables, REWARD_IDS } from '../utils/youtubePlayables';
import { adapter } from '../platforms';
import { MultiplayerSession, MultiplayerPlayer, updateScore, getPlayers, subscribeToPlayers, resetSessionForRematch } from '../utils/multiplayer';
import { Haptics } from '../utils/haptics';
import { shareScore, getAvatarColor, getInitials } from '../utils/social';

const TutorialOverlay = lazy(() => import('../components/TutorialOverlay'));
const SettingsOverlay = lazy(() => import('../components/SettingsOverlay'));
const DailyChallengeOverlay = lazy(() => import('../components/DailyChallengeOverlay'));
const AchievementToast = lazy(() => import('../components/AchievementToast'));
const AchievementsOverlay = lazy(() => import('../components/AchievementsOverlay'));
const MultiplayerOverlay = lazy(() => import('../components/MultiplayerOverlay'));
const MultiplayerScoreboard = lazy(() => import('../components/MultiplayerScoreboard'));
const MultiplayerResults = lazy(() => import('../components/MultiplayerResults'));
const ConfettiEffect = lazy(() => import('../components/ConfettiEffect'));
const LevelUpOverlay = lazy(() => import('../components/LevelUpOverlay'));
const StatsOverlay = lazy(() => import('../components/StatsOverlay'));
const WeeklyChallengeOverlay = lazy(() => import('../components/WeeklyChallengeOverlay'));
const WeeklyGhostPace = lazy(() => import('../components/WeeklyGhostPace'));
const LevelJourneyOverlay = lazy(() => import('../components/LevelJourneyOverlay'));

interface PlayablesSave {
  version: 1;
  gameState?: GameState;
  isDailyMode?: boolean;
  isWeeklyMode?: boolean;
  settings?: GameSettings;
  highScores?: HighScore[];
  tutorialSeen?: boolean;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

const isRestorableGameState = (value: unknown): value is GameState => {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return Array.isArray(state.bubbles) && typeof state.score === 'number' &&
    typeof state.level === 'number' && typeof state.lives === 'number';
};

const Index = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [isYouTubePlayable, setIsYouTubePlayable] = useState(false);
  const [isPlatformAudioEnabled, setIsPlatformAudioEnabled] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
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
  const [showWeeklyChallenge, setShowWeeklyChallenge] = useState(false);
  const [showLevelJourney, setShowLevelJourney] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [isWeeklyMode, setIsWeeklyMode] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mpSession, setMpSession] = useState<MultiplayerSession | null>(null);
  const [mpPlayers, setMpPlayers] = useState<MultiplayerPlayer[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('bubble-pop-settings');
    const s: GameSettings = saved
      ? { colorBlindMode: false, reduceMotion: false, hapticsEnabled: true, particleStyle: 'spark', ...JSON.parse(saved) }
      : { difficulty: 'normal', volume: 80, theme: 'neon', particleStyle: 'spark', colorBlindMode: false, reduceMotion: false, hapticsEnabled: true };
    setDifficulty(s.difficulty);
    setTheme(s.theme);
    setColorBlindMode(s.colorBlindMode);
    setParticleStyle(s.particleStyle);
    Haptics.setEnabled(s.hapticsEnabled);
    return s;
  });

  const [streak, setStreak] = useState<number>(() => getStreak());
  const [pendingReward, setPendingReward] = useState<StreakReward | null>(() => peekPendingReward());

  const [mpTimeLeft, setMpTimeLeft] = useState<number | null>(null);
  const [showMpResults, setShowMpResults] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [weeklyGhost, setWeeklyGhost] = useState<WeeklyGhostRun | null>(() => getWeeklyGhost());
  // Ads state
  const [adRewardPending, setAdRewardPending] = useState(false);
  const [showRewardedAdOffer, setShowRewardedAdOffer] = useState(false);
  const mpTimerRef = useRef<ReturnType<typeof setInterval>>();
  const gameStateRef = useRef(gameState);
  const gameSettingsRef = useRef(gameSettings);
  const highScoresRef = useRef(highScores);
  const isDailyModeRef = useRef(isDailyMode);
  const isWeeklyModeRef = useRef(isWeeklyMode);
  const weeklyRunStartedAtRef = useRef<number>(0);
  const weeklyShotLogRef = useRef<GhostShot[]>([]);

  const MATCH_DURATION = 120; // seconds

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameShellRef = useRef<HTMLDivElement>(null);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const gameLoopRef = useRef<number>();
  const shakeRef = useRef<number>();

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gameSettingsRef.current = gameSettings; }, [gameSettings]);
  useEffect(() => { highScoresRef.current = highScores; }, [highScores]);
  useEffect(() => { isDailyModeRef.current = isDailyMode; }, [isDailyMode]);
  useEffect(() => { isWeeklyModeRef.current = isWeeklyMode; }, [isWeeklyMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', gameSettings.reduceMotion);
    return () => document.documentElement.classList.remove('reduce-motion');
  }, [gameSettings.reduceMotion]);

  const getPlayablesSave = useCallback((): PlayablesSave => {
    const game = gameStateRef.current;
    return {
      version: 1,
      gameState: { ...game, isPaused: false, particles: [], comboTexts: [], soundEvent: undefined, levelComplete: false },
      isDailyMode: isDailyModeRef.current,
      isWeeklyMode: isWeeklyModeRef.current,
      settings: gameSettingsRef.current,
      highScores: highScoresRef.current,
      tutorialSeen: Boolean(localStorage.getItem('bubble-pop-tutorial-seen')),
    };
  }, []);

  const triggerScreenShake = useCallback((intensity: number = 8, duration: number = 300) => {
    if (gameSettings.reduceMotion) return;
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
      isWeeklyMode,
      isGameOver: newState.isGameOver,
    });
    if (newlyUnlocked.length > 0) {
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, [isDailyMode, isWeeklyMode]);

  useEffect(() => {
    let mounted = true;

    const setupPlatform = async () => {
      const active = await adapter.init({
        onPause: () => setGameState(prev => ({ ...prev, isPaused: true })),
        onResume: () => setGameState(prev => ({ ...prev, isPaused: false })),
        onAudioEnabledChange: (enabled) => {
          SoundManager.setPlatformAudioEnabled(enabled);
          setIsPlatformAudioEnabled(enabled);
          setIsMuted(!enabled || SoundManager.isMuted());
        },
        getSaveData: getPlayablesSave,
      });
      if (!mounted) return;

      setIsYouTubePlayable(adapter.platform === 'youtube' && adapter.isActive());
      const saved = await adapter.loadData<PlayablesSave>();
      if (!mounted || !saved || saved.version !== 1) return;

      if (saved.settings) {
        const restoredSettings: GameSettings = { colorBlindMode: false, reduceMotion: false, hapticsEnabled: true, particleStyle: 'spark', ...saved.settings };
        localStorage.setItem('bubble-pop-settings', JSON.stringify(restoredSettings));
        setGameSettings(restoredSettings);
        setDifficulty(restoredSettings.difficulty);
        setTheme(restoredSettings.theme);
        setColorBlindMode(restoredSettings.colorBlindMode);
        setParticleStyle(restoredSettings.particleStyle);
        Haptics.setEnabled(restoredSettings.hapticsEnabled);
        SoundManager.setVolume(restoredSettings.volume / 100);
      }
      if (Array.isArray(saved.highScores)) {
        localStorage.setItem('bubble-shooter-highscores', JSON.stringify(saved.highScores));
        setHighScores(saved.highScores);
      }
      if (saved.tutorialSeen) {
        localStorage.setItem('bubble-pop-tutorial-seen', 'true');
        setShowTutorial(false);
      }
      if (isRestorableGameState(saved.gameState)) {
        setGameState({ ...saved.gameState, isPaused: false, particles: [], comboTexts: [], soundEvent: undefined, levelComplete: false });
        setIsDailyMode(Boolean(saved.isDailyMode));
        setIsWeeklyMode(Boolean(saved.isWeeklyMode));
      }
    };

    void setupPlatform().finally(() => {
      if (!mounted) return;
      requestAnimationFrame(() => {
        adapter.firstFrameReady();
        adapter.gameReady();
      });
    });
    return () => { mounted = false; };
  }, [getPlayablesSave]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => { void adapter.saveData(getPlayablesSave()); }, 350);
    return () => window.clearTimeout(saveTimer);
  }, [gameState.score, gameState.level, gameState.lives, gameState.bubbles.length, gameState.isGameOver, gameSettings, highScores, isDailyMode, showTutorial, getPlayablesSave]);

  useEffect(() => {
    window.render_game_to_text = () => {
      const state = gameStateRef.current;
      return JSON.stringify({
        coordinateSystem: 'canvas origin is top-left; x increases right and y increases down',
        mode: state.isGameOver ? 'game-over' : state.isPaused ? 'paused' : 'playing',
        score: state.score,
        level: state.level,
        lives: state.lives,
        combo: state.combo,
        adaptiveTier: state.adaptiveTier,
        accuracy: state.shotsFired ? Math.round((state.successfulShots / state.shotsFired) * 100) : 0,
        boss: state.isBossLevel ? { name: state.bossName, defeated: state.bossDefeated } : null,
        currentBubble: state.currentBubble ? { color: state.currentBubble.color, powerUp: state.currentBubble.powerUp } : null,
        nextBubble: state.nextBubble ? { color: state.nextBubble.color, powerUp: state.nextBubble.powerUp } : null,
        bubbles: state.bubbles.map((bubble) => ({ x: bubble.position.x, y: bubble.position.y, color: bubble.color, powerUp: bubble.powerUp })),
      });
    };
    const installedFallbackClock = typeof window.advanceTime !== 'function';
    if (installedFallbackClock) {
      window.advanceTime = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    }
    return () => {
      delete window.render_game_to_text;
      if (installedFallbackClock) delete window.advanceTime;
    };
  }, [gameSettings.reduceMotion]);

  useEffect(() => {
    const check = () => setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false); setShowDailyChallenge(false); setShowWeeklyChallenge(false); setShowLevelJourney(false);
        setShowAchievements(false); setShowStats(false); setShowMultiplayer(false);
        return;
      }
      if (event.key.toLowerCase() !== 'f') return;
      if (document.fullscreenElement) void document.exitFullscreen();
      else void gameShellRef.current?.requestFullscreen?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Daily streak check-in (runs once on mount)
  useEffect(() => {
    const result = checkInDailyStreak();
    setStreak(result.streak);
    setPendingReward(peekPendingReward());
    if (result.continued) {
      toast.success(`🔥 Streak continued — Day ${result.streak}!`, {
        description: result.reward
          ? `${result.reward.milestoneLabel} +${result.reward.bonusPoints} bonus${result.reward.guaranteedPowerUp ? ` & guaranteed ${result.reward.guaranteedPowerUp}` : ''}`
          : 'Keep it going tomorrow for bigger rewards.',
      });
    } else if (result.started && result.streak === 1) {
      toast(`🔥 Daily streak started!`, { description: 'Come back tomorrow to keep it alive.' });
    }
    // Apply any pending reward to the freshly initialized game state
    if (peekPendingReward()) {
      setGameState(prev => applyStreakRewardRef.current(prev));
    }
  }, []);

  // Ref so the mount effect can call the latest applyStreakReward
  const applyStreakRewardRef = useRef<(s: GameState) => GameState>((s) => s);

  const applyStreakReward = useCallback((state: GameState): GameState => {
    const reward = consumePendingReward();
    if (!reward) return state;
    setPendingReward(null);
    let next = { ...state, score: state.score + reward.bonusPoints };
    if (reward.guaranteedPowerUp && next.currentBubble) {
      next = { ...next, currentBubble: { ...next.currentBubble, powerUp: reward.guaranteedPowerUp } };
    }
    toast.success(`🎁 Streak Reward Applied`, {
      description: `+${reward.bonusPoints} pts${reward.guaranteedPowerUp ? ` · ${reward.guaranteedPowerUp} power-up loaded` : ''}`,
    });
    return next;
  }, []);
  applyStreakRewardRef.current = applyStreakReward;

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
    let newState = applyAdaptiveDifficulty(gameState, updateGameState(gameState, angle));
    recordShot(gameState.bubbles.length - newState.bubbles.length);
    if (isWeeklyMode && weeklyRunStartedAtRef.current) {
      weeklyShotLogRef.current.push({ angle, elapsedMs: Date.now() - weeklyRunStartedAtRef.current });
    }

    if (newState.soundEvent) {
      const evt = newState.soundEvent;
      if (evt === 'bomb') {
        SoundManager.bomb();
        Haptics.explosion();
        triggerScreenShake(12, 400);
      }
      else if (evt === 'freeze') SoundManager.freeze();
      else if (evt === 'rainbow') SoundManager.rainbow();
      else if (evt === 'nova') { SoundManager.bomb(); Haptics.explosion(); triggerScreenShake(14, 450); }
      else if (evt === 'boss-defeated') { SoundManager.levelUp(); Haptics.levelUp(); triggerScreenShake(16, 550); }
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
      adapter.sendScore(newState.score);
      // Request interstitial ad between levels (non-blocking, best-effort)
      void adapter.requestInterstitialAd();
      setShowLevelUp(true);
      const nextLevel = newState.level + 1;
      setGameState(newState);
      // Check level achievements
      queueAchievements({ ...newState, level: nextLevel }, undefined);
      setTimeout(() => {
        setShowLevelUp(false);
        setGameState(initializeGame(nextLevel, newState.score, isWeeklyMode ? 'weekly' : isDailyMode));
      }, 2000);
      return;
    }

    setGameState(newState);
    // Update multiplayer score
    if (mpSession) updateScore(mpSession.sessionId, newState.score, newState.level, false);
    if (checkGameOver(newState)) {
      SoundManager.gameOver();
      Haptics.gameOver();
      adapter.sendScore(newState.score);
      const finalState = { ...newState, isGameOver: true };
      setGameState(finalState);
      // Request interstitial ad on game over (non-blocking)
      void adapter.requestInterstitialAd();
      // Offer rewarded ad for continue (only in active gaming environments, normal mode)
      if (adapter.isActive() && !mpSession && !isDailyMode && !isWeeklyMode) {
        setShowRewardedAdOffer(true);
      }
      if (mpSession) {
        updateScore(mpSession.sessionId, finalState.score, finalState.level, true);
        setShowMpResults(true);
      }
      queueAchievements(finalState, undefined);
      if (isDailyMode) {
        saveDailyResult(newState.score, newState.level, playerName || 'Player');
      }
      if (isWeeklyMode) saveWeeklyResult(newState.score, newState.level);
      recordCompletedGame(newState.score, newState.level, isWeeklyMode ? 'weekly' : isDailyMode ? 'daily' : 'normal');
      if (isWeeklyMode && weeklyRunStartedAtRef.current) {
        const savedGhost = saveWeeklyGhost({ score: newState.score, level: newState.level, durationMs: Date.now() - weeklyRunStartedAtRef.current, shots: weeklyShotLogRef.current });
        if (savedGhost) setWeeklyGhost(getWeeklyGhost());
      }
      queueAchievements(finalState, undefined);
      if (isHighScore(newState.score)) {
        setShowNameInput(true);
        setShowConfetti(true);
        SoundManager.celebration();
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [gameState, triggerScreenShake, isDailyMode, isWeeklyMode, playerName, queueAchievements, mpSession]);

  const handleRestart = () => {
    setIsDailyMode(false);
    setIsWeeklyMode(false);
    setMpSession(null);
    setMpPlayers([]);
    setMpTimeLeft(null);
    setShowMpResults(false);
    setShowRewardedAdOffer(false);
    if (mpTimerRef.current) clearInterval(mpTimerRef.current);
    setGameState(applyStreakReward(initializeGame()));
    setShowLevelUp(false);
    setShowNameInput(false);
  };

  /** Player taps "Watch Ad to Continue" — request rewarded ad for +1 life. */
  const handleContinueWithAd = async () => {
    setAdRewardPending(true);
    try {
      const earned = await adapter.requestRewardedAd(REWARD_IDS.EXTRA_LIFE);
      if (earned) {
        // Grant extra life and resume
        setGameState(prev => ({
          ...prev,
          isGameOver: false,
          lives: 1,
          isPaused: false,
        }));
        toast.success('❤️ Extra life granted! Keep going!');
      } else {
        toast('Ad not completed — no reward earned.');
      }
    } catch {
      toast.error('Ad unavailable. Try again later.');
    } finally {
      setAdRewardPending(false);
      setShowRewardedAdOffer(false);
    }
  };

  /** Player skips the rewarded ad offer. */
  const handleSkipRewardedAd = () => {
    setShowRewardedAdOffer(false);
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
    setIsWeeklyMode(false);
    setShowDailyChallenge(false);
    setGameState(applyStreakReward(initializeGame(1, 0, true)));
    setShowLevelUp(false);
    setShowNameInput(false);
  };

  const handleStartWeekly = () => {
    setIsDailyMode(false);
    setIsWeeklyMode(true);
    setShowWeeklyChallenge(false);
    weeklyRunStartedAtRef.current = Date.now();
    weeklyShotLogRef.current = [];
    setWeeklyGhost(getWeeklyGhost());
    setGameState(applyStreakReward(initializeGame(1, 0, 'weekly')));
    setShowLevelUp(false);
    setShowNameInput(false);
  };

  const handlePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleToggleMute = () => {
    // YouTube's mute setting always wins over in-game controls.
    if (isYouTubePlayable && !isPlatformAudioEnabled) return;
    const muted = SoundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleSaveSettings = (s: GameSettings) => {
    setGameSettings(s);
    localStorage.setItem('bubble-pop-settings', JSON.stringify(s));
    setDifficulty(s.difficulty);
    setTheme(s.theme);
    setColorBlindMode(s.colorBlindMode);
    setParticleStyle(s.particleStyle);
    Haptics.setEnabled(s.hapticsEnabled);
    SoundManager.setVolume(s.volume / 100);
    setShowSettings(false);
    setGameState(initializeGame(1, 0, isWeeklyMode ? 'weekly' : isDailyMode));
  };

  const handleSaveScore = async () => {
    const name = playerName.trim() || 'Player';
    const updated = await saveHighScore(gameState.score, gameState.level, name);
    setHighScores(updated);
    if (isDailyMode) {
      saveDailyResult(gameState.score, gameState.level, name);
    }
    if (isWeeklyMode) saveWeeklyResult(gameState.score, gameState.level);
    setShowNameInput(false);
    setPlayerName('');
  };

  const isLandscape = orientation === 'landscape';
  const targetScore = getTargetScore(gameState.level);
  const progress = Math.min(100, Math.floor((gameState.score / targetScore) * 100));

  return (
    <Suspense fallback={null}>
    <div ref={gameShellRef} className="min-h-[100dvh] bg-[#0a0a1a] flex items-center justify-center p-2 overflow-hidden">
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
      <div className={`apple-glass-surface relative backdrop-blur-xl rounded-3xl shadow-2xl border overflow-hidden w-full max-w-[1100px] h-[calc(100dvh-1rem)] max-h-[720px] ${
        isLandscape
          ? 'flex flex-row p-3 gap-3'
          : 'flex flex-col p-3'
      }`}>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-xl -z-10" />

        {/* Side/Top panel */}
        <div className={`flex flex-col overflow-y-auto ${isLandscape ? 'w-52 shrink-0 justify-between' : 'shrink-0'}`}>
          <GameUI gameState={gameState} onRestart={handleRestart} onPause={handlePause} />
          <div className="mt-1 flex justify-center">
            <StreakBadge streak={streak} pendingPowerUp={pendingReward?.guaranteedPowerUp ?? null} />
          </div>
          {isDailyMode && (
            <div className="mt-1 text-center">
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">
                📅 DAILY CHALLENGE
              </span>
            </div>
          )}
          {isWeeklyMode && (
            <div className="mt-1 text-center">
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">🗓️ WEEKLY CHALLENGE</span>
            </div>
          )}

          {/* Level progress */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className={`${gameState.isBossLevel && !gameState.bossDefeated ? 'text-amber-300' : 'text-purple-400'} font-bold`}>
                {gameState.isBossLevel && !gameState.bossDefeated ? `♛ ${gameState.bossName}` : `Level ${gameState.level}`}
              </span>
              <span className="text-gray-400">{gameState.isBossLevel && !gameState.bossDefeated ? 'BOSS' : `${progress}%`}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${gameState.isBossLevel && !gameState.bossDefeated ? 'bg-gradient-to-r from-amber-400 to-pink-500' : 'bg-gradient-to-r from-pink-500 to-cyan-500'}`} style={{ width: `${gameState.isBossLevel && !gameState.bossDefeated ? 100 : progress}%` }} />
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-center">
              {gameState.isBossLevel && !gameState.bossDefeated ? 'Match the boss core to clear this world' : `Target: ${targetScore.toLocaleString()}`}
            </div>
          </div>

          {/* Controls row */}
          <ComboCounter combo={gameState.combo} />

          <PowerUpIndicators
            currentBubble={gameState.currentBubble ?? null}
            nextBubble={gameState.nextBubble ?? null}
            isFrozen={gameState.isFrozen}
            frozenTimer={gameState.frozenTimer}
          />

          {/* Controls row */}
          <div className="flex items-center justify-end mt-2 gap-1 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {!isYouTubePlayable && (
                <button
                  onClick={handleToggleMute}
                  className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 transition-all border border-white/10"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              )}
              <button
                onClick={() => {
                  if (isMusicOn) { SoundManager.stopMusic(); } else { SoundManager.startMusic(); }
                  setIsMusicOn(!isMusicOn);
                }}
                className={`w-7 h-7 flex items-center justify-center ${isMusicOn ? 'bg-purple-500/20 border-purple-500/30' : 'bg-white/10 border-white/10'} text-white rounded-lg text-xs hover:bg-purple-500/30 transition-all border`}
                title={isMusicOn ? 'Stop Music' : 'Play Music'}
              >
                {isMusicOn ? '🎵' : '🎶'}
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
                onClick={() => setShowWeeklyChallenge(true)}
                className="w-7 h-7 flex items-center justify-center bg-blue-500/20 text-white rounded-lg text-xs hover:bg-blue-500/30 transition-all border border-blue-500/20"
                title="Weekly Challenge"
              >
                🗓️
              </button>
              <button
                onClick={() => setShowLevelJourney(true)}
                className="w-7 h-7 flex items-center justify-center bg-indigo-500/20 text-white rounded-lg text-xs hover:bg-indigo-500/30 transition-all border border-indigo-400/20"
                title="Level Journey"
              >
                ✦
              </button>
              {!isYouTubePlayable && (
                <button
                  onClick={() => setShowMultiplayer(true)}
                  className="w-7 h-7 flex items-center justify-center bg-green-500/20 text-white rounded-lg text-xs hover:bg-green-500/30 transition-all border border-green-500/20"
                  title="Multiplayer"
                >
                  🎮
                </button>
              )}
              <button
                onClick={() => setShowStats(true)}
                className="w-7 h-7 flex items-center justify-center bg-cyan-500/20 text-white rounded-lg text-xs hover:bg-cyan-500/30 transition-all border border-cyan-500/20"
                title="Stats"
              >
                📊
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
          {isWeeklyMode && weeklyGhost && weeklyRunStartedAtRef.current > 0 && (
            <WeeklyGhostPace ghost={weeklyGhost} elapsedMs={Date.now() - weeklyRunStartedAtRef.current} score={gameState.score} />
          )}
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
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${getAvatarColor(hs.name)[0]}, ${getAvatarColor(hs.name)[1]})` }}
                      >
                        {getInitials(hs.name)}
                      </div>
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

        {showLevelUp && <LevelUpOverlay level={gameState.level + 1} />}

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

        <ConfettiEffect active={showConfetti} />

        {/* Game Over overlay (non-multiplayer) */}
        {gameState.isGameOver && !showMpResults && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 animate-fade-in">
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl p-6 text-center shadow-xl border border-pink-500/30 w-72">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-3">Game Over!</h2>
              {isDailyMode && (
                <p className="text-yellow-400 text-xs font-bold mb-1">📅 Daily Challenge</p>
              )}
              {isWeeklyMode && (
                <p className="text-cyan-300 text-xs font-bold mb-1">🗓️ Weekly Challenge</p>
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

              {!isYouTubePlayable && (
                <div className="flex gap-2 mb-4 justify-center">
                  <button onClick={() => shareScore(gameState.score, gameState.level, 'twitter')} className="px-3 py-1.5 bg-[#1da1f2]/20 hover:bg-[#1da1f2]/40 text-[#1da1f2] rounded-lg text-xs font-medium transition-all" title="Share on X">𝕏</button>
                  <button onClick={() => shareScore(gameState.score, gameState.level, 'facebook')} className="px-3 py-1.5 bg-[#1877f2]/20 hover:bg-[#1877f2]/40 text-[#1877f2] rounded-lg text-xs font-medium transition-all" title="Share on Facebook">f</button>
                  <button onClick={() => { shareScore(gameState.score, gameState.level, 'copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-xs font-medium transition-all" title="Copy to clipboard">{copied ? '✓' : '📋'}</button>
                </div>
              )}

              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Rewarded Ad Offer overlay — shown in Playables env on game over */}
        {showRewardedAdOffer && gameState.isGameOver && !showMpResults && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20 animate-fade-in">
            <div className="bg-gradient-to-br from-yellow-900/90 to-red-900/90 rounded-2xl p-6 text-center shadow-xl border border-yellow-500/40 w-72">
              <div className="text-4xl mb-2">🎁</div>
              <h2 className="text-xl font-bold text-yellow-300 mb-1">Continue Playing?</h2>
              <p className="text-sm text-gray-300 mb-4">
                Watch a short ad to get <span className="text-red-400 font-bold">+1 Life</span> and keep your score of{' '}
                <span className="text-white font-bold">{gameState.score.toLocaleString()}</span>.
              </p>
              <button
                onClick={handleContinueWithAd}
                disabled={adRewardPending}
                className="w-full mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {adRewardPending ? '⌛ Loading Ad...' : '▶️ Watch Ad · Get Extra Life'}
              </button>
              <button
                onClick={handleSkipRewardedAd}
                disabled={adRewardPending}
                className="w-full text-gray-400 text-xs hover:text-white transition-colors py-1"
              >
                No thanks — Play Again
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

        {showWeeklyChallenge && (
          <WeeklyChallengeOverlay onStart={handleStartWeekly} onClose={() => setShowWeeklyChallenge(false)} />
        )}

        {showLevelJourney && <LevelJourneyOverlay currentLevel={gameState.level} onClose={() => setShowLevelJourney(false)} />}

        {/* Achievements overlay */}
        {showAchievements && (
          <AchievementsOverlay onClose={() => setShowAchievements(false)} />
        )}

        {/* Multiplayer overlay */}
        {showMultiplayer && !isYouTubePlayable && (
          <MultiplayerOverlay
            onStart={handleStartMultiplayer}
            onClose={() => setShowMultiplayer(false)}
          />
        )}

        {/* Stats overlay */}
        {showStats && (
          <StatsOverlay onClose={() => setShowStats(false)} />
        )}

      </div>

      {/* Combo display */}
      {gameState.combo >= 2 && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-xl animate-bounce z-30">
          Combo x{gameState.combo}!
        </div>
      )}
    </div>
    </Suspense>
  );
};

export default Index;
