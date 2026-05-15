// Daily streak tracker with milestone rewards.
// Uses localStorage. Resets if a day is missed (gap > 1 day).

const KEY = 'bubble-pop-daily-streak';
const REWARD_KEY = 'bubble-pop-streak-reward-pending';

export type PowerUpType = 'bomb' | 'freeze' | 'rainbow';

export interface StreakState {
  streak: number;
  lastDay: string; // YYYY-MM-DD
}

export interface StreakReward {
  bonusPoints: number;
  guaranteedPowerUp: PowerUpType | null;
  milestoneLabel?: string;
}

export interface CheckInResult {
  streak: number;
  continued: boolean; // day changed and streak grew
  started: boolean;   // first time / reset
  reward: StreakReward | null;
}

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysBetween = (a: string, b: string): number => {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
};

const read = (): StreakState | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (s: StreakState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
};

const milestoneReward = (streak: number): StreakReward | null => {
  if (streak === 3) return { bonusPoints: 250, guaranteedPowerUp: null, milestoneLabel: '3-Day Streak!' };
  if (streak === 5) return { bonusPoints: 500, guaranteedPowerUp: 'bomb', milestoneLabel: '5-Day Streak!' };
  if (streak === 7) return { bonusPoints: 1000, guaranteedPowerUp: 'rainbow', milestoneLabel: '7-Day Streak!' };
  if (streak === 14) return { bonusPoints: 2500, guaranteedPowerUp: 'freeze', milestoneLabel: '2-Week Streak!' };
  if (streak > 0 && streak % 30 === 0) return { bonusPoints: 5000, guaranteedPowerUp: 'rainbow', milestoneLabel: `${streak}-Day Legend!` };
  return null;
};

export const getStreak = (): number => read()?.streak ?? 0;

export const checkInDailyStreak = (): CheckInResult => {
  const today = todayStr();
  const prev = read();

  if (!prev) {
    write({ streak: 1, lastDay: today });
    const reward = milestoneReward(1);
    if (reward) localStorage.setItem(REWARD_KEY, JSON.stringify(reward));
    return { streak: 1, continued: false, started: true, reward };
  }

  if (prev.lastDay === today) {
    return { streak: prev.streak, continued: false, started: false, reward: null };
  }

  const gap = daysBetween(prev.lastDay, today);
  let newStreak: number;
  let continued = false;
  let started = false;
  if (gap === 1) {
    newStreak = prev.streak + 1;
    continued = true;
  } else {
    newStreak = 1;
    started = true;
  }
  write({ streak: newStreak, lastDay: today });
  const reward = milestoneReward(newStreak);
  if (reward) localStorage.setItem(REWARD_KEY, JSON.stringify(reward));
  return { streak: newStreak, continued, started, reward };
};

export const consumePendingReward = (): StreakReward | null => {
  const raw = localStorage.getItem(REWARD_KEY);
  if (!raw) return null;
  localStorage.removeItem(REWARD_KEY);
  try {
    return JSON.parse(raw) as StreakReward;
  } catch {
    return null;
  }
};

export const peekPendingReward = (): StreakReward | null => {
  const raw = localStorage.getItem(REWARD_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StreakReward; } catch { return null; }
};
