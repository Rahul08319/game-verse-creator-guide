
const ACHIEVEMENTS_KEY = 'bubble-pop-achievements';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_pop', title: 'First Pop', description: 'Pop your first group of bubbles', icon: '🫧' },
  { id: 'first_bomb', title: 'Demolisher', description: 'Use a bomb power-up', icon: '💣' },
  { id: 'first_freeze', title: 'Ice Age', description: 'Use a freeze power-up', icon: '❄️' },
  { id: 'first_rainbow', title: 'Rainbow Road', description: 'Use a rainbow power-up', icon: '🌈' },
  { id: 'combo_3', title: 'Combo Starter', description: 'Reach a 3x combo', icon: '🔥' },
  { id: 'combo_5', title: 'Combo Master', description: 'Reach a 5x combo', icon: '⚡' },
  { id: 'combo_10', title: 'Combo Legend', description: 'Reach a 10x combo', icon: '🌟' },
  { id: 'level_3', title: 'Getting Warmed Up', description: 'Reach Level 3', icon: '🎯' },
  { id: 'level_5', title: 'Halfway Hero', description: 'Reach Level 5', icon: '🏅' },
  { id: 'level_10', title: 'Bubble Master', description: 'Reach Level 10', icon: '👑' },
  { id: 'score_1000', title: 'Score Chaser', description: 'Score 1,000 points', icon: '💯' },
  { id: 'score_5000', title: 'High Roller', description: 'Score 5,000 points', icon: '💎' },
  { id: 'score_10000', title: 'Score Legend', description: 'Score 10,000 points', icon: '🏆' },
  { id: 'daily_complete', title: 'Daily Warrior', description: 'Complete a daily challenge', icon: '📅' },
  { id: 'clear_board', title: 'Clean Sweep', description: 'Clear all bubbles from the board', icon: '✨' },
];

export const getAllAchievements = (): Achievement[] => {
  const unlocked = getUnlockedIds();
  return ACHIEVEMENT_DEFS.map(a => ({
    ...a,
    unlockedAt: unlocked[a.id] || undefined,
  }));
};

const getUnlockedIds = (): Record<string, string> => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const isUnlocked = (id: string): boolean => {
  return !!getUnlockedIds()[id];
};

/** Returns the achievement if newly unlocked, null if already had it */
export const unlockAchievement = (id: string): Achievement | null => {
  const unlocked = getUnlockedIds();
  if (unlocked[id]) return null;
  unlocked[id] = new Date().toISOString();
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
  return def ? { ...def, unlockedAt: unlocked[id] } : null;
};

export interface AchievementCheckResult {
  newlyUnlocked: Achievement[];
}

/** Check all conditions and return newly unlocked achievements */
export const checkAchievements = (context: {
  soundEvent?: string;
  combo: number;
  level: number;
  score: number;
  bubblesLeft: number;
  isDailyMode: boolean;
  isGameOver: boolean;
}): AchievementCheckResult => {
  const newlyUnlocked: Achievement[] = [];
  const tryUnlock = (id: string) => {
    const a = unlockAchievement(id);
    if (a) newlyUnlocked.push(a);
  };

  // Sound event based
  if (context.soundEvent === 'bomb') tryUnlock('first_bomb');
  if (context.soundEvent === 'freeze') tryUnlock('first_freeze');
  if (context.soundEvent === 'rainbow') tryUnlock('first_rainbow');
  if (context.soundEvent === 'pop' || context.soundEvent?.startsWith('combo-')) tryUnlock('first_pop');

  // Combo
  if (context.combo >= 3) tryUnlock('combo_3');
  if (context.combo >= 5) tryUnlock('combo_5');
  if (context.combo >= 10) tryUnlock('combo_10');

  // Level
  if (context.level >= 3) tryUnlock('level_3');
  if (context.level >= 5) tryUnlock('level_5');
  if (context.level >= 10) tryUnlock('level_10');

  // Score
  if (context.score >= 1000) tryUnlock('score_1000');
  if (context.score >= 5000) tryUnlock('score_5000');
  if (context.score >= 10000) tryUnlock('score_10000');

  // Board clear
  if (context.bubblesLeft === 0) tryUnlock('clear_board');

  // Daily
  if (context.isDailyMode && context.isGameOver) tryUnlock('daily_complete');

  return { newlyUnlocked };
};

export const getUnlockedCount = (): number => {
  return Object.keys(getUnlockedIds()).length;
};

export const getTotalCount = (): number => ACHIEVEMENT_DEFS.length;
