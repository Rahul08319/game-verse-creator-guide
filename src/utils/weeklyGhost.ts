import { getWeekKey } from './weeklyChallenge';

const WEEKLY_GHOST_KEY = 'bubble-pop-weekly-ghost-v1';

export interface GhostShot { angle: number; elapsedMs: number; }
export interface WeeklyGhostRun { week: string; score: number; level: number; durationMs: number; shots: GhostShot[]; }

export const getWeeklyGhost = (): WeeklyGhostRun | null => {
  try {
    const ghost = JSON.parse(localStorage.getItem(WEEKLY_GHOST_KEY) || 'null') as WeeklyGhostRun | null;
    return ghost?.week === getWeekKey() && Array.isArray(ghost.shots) ? ghost : null;
  } catch { return null; }
};

export const saveWeeklyGhost = (run: Omit<WeeklyGhostRun, 'week'>): boolean => {
  const current = getWeeklyGhost();
  if (current && current.score > run.score) return false;
  localStorage.setItem(WEEKLY_GHOST_KEY, JSON.stringify({ ...run, week: getWeekKey(), shots: run.shots.slice(0, 250) }));
  return true;
};
