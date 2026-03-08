
import { getDailySeed } from './gameLogic';

const DAILY_STORAGE_KEY = 'bubble-pop-daily';
const DAILY_LEADERBOARD_KEY = 'bubble-pop-daily-leaderboard';

export interface DailyScore {
  score: number;
  level: number;
  name: string;
  date: string;
  seed: number;
}

export const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const hasPlayedToday = (): boolean => {
  try {
    const data = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.date === getTodayKey();
  } catch {
    return false;
  }
};

export const saveDailyResult = (score: number, level: number, name: string): void => {
  const result = {
    score,
    level,
    name,
    date: getTodayKey(),
    seed: getDailySeed(),
  };
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(result));

  // Add to daily leaderboard
  const leaderboard = getDailyLeaderboard();
  leaderboard.push(result);
  leaderboard.sort((a, b) => b.score - a.score);
  const top20 = leaderboard.slice(0, 20);
  localStorage.setItem(DAILY_LEADERBOARD_KEY, JSON.stringify(top20));
};

export const getDailyLeaderboard = (): DailyScore[] => {
  try {
    const data = localStorage.getItem(DAILY_LEADERBOARD_KEY);
    if (!data) return [];
    const scores: DailyScore[] = JSON.parse(data);
    // Only return scores from today
    const today = getTodayKey();
    return scores.filter(s => s.date === today);
  } catch {
    return [];
  }
};

export const getTodayBestScore = (): number => {
  try {
    const data = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    if (parsed.date !== getTodayKey()) return 0;
    return parsed.score || 0;
  } catch {
    return 0;
  }
};
