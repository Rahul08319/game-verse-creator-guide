const PROFILE_KEY = 'bubble-pop-player-profile-v1';

export interface PlayerProgress {
  gamesPlayed: number;
  totalScore: number;
  totalShots: number;
  bubblesPopped: number;
  bestScore: number;
  bestLevel: number;
  dailyRuns: number;
  weeklyRuns: number;
}

const emptyProfile = (): PlayerProgress => ({ gamesPlayed: 0, totalScore: 0, totalShots: 0, bubblesPopped: 0, bestScore: 0, bestLevel: 0, dailyRuns: 0, weeklyRuns: 0 });

export const getPlayerProgress = (): PlayerProgress => {
  try { return { ...emptyProfile(), ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') }; }
  catch { return emptyProfile(); }
};

const save = (profile: PlayerProgress) => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

export const recordShot = (popped: number): void => {
  const profile = getPlayerProgress();
  profile.totalShots += 1;
  profile.bubblesPopped += Math.max(0, popped);
  save(profile);
};

export const recordCompletedGame = (score: number, level: number, mode: 'normal' | 'daily' | 'weekly'): PlayerProgress => {
  const profile = getPlayerProgress();
  profile.gamesPlayed += 1;
  profile.totalScore += Math.max(0, score);
  profile.bestScore = Math.max(profile.bestScore, score);
  profile.bestLevel = Math.max(profile.bestLevel, level);
  if (mode === 'daily') profile.dailyRuns += 1;
  if (mode === 'weekly') profile.weeklyRuns += 1;
  save(profile);
  return profile;
};
