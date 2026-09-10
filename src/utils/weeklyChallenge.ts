import { getWeeklySeed } from './gameLogic';

const WEEKLY_KEY = 'bubble-pop-weekly-result';

export const getWeekKey = (): string => String(getWeeklySeed());

export const getWeeklyBestScore = (): number => {
  try {
    const result = JSON.parse(localStorage.getItem(WEEKLY_KEY) || 'null');
    return result?.week === getWeekKey() ? result.score : 0;
  } catch {
    return 0;
  }
};

export const saveWeeklyResult = (score: number, level: number): void => {
  const current = getWeeklyBestScore();
  if (score < current) return;
  localStorage.setItem(WEEKLY_KEY, JSON.stringify({ week: getWeekKey(), score, level }));
};
