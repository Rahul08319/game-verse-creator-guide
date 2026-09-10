import type { ParticleStyle, ThemeName } from './gameLogic';
import { getPlayerProgress } from './playerProgress';

export interface CosmeticUnlocks {
  themes: ThemeName[];
  particleStyles: ParticleStyle[];
}

/** Cosmetic rewards are local-only and derive from permanent player progress. */
export const getCosmeticUnlocks = (): CosmeticUnlocks => {
  const progress = getPlayerProgress();
  return {
    themes: [
      'neon', 'retro', 'ocean',
      ...(progress.bestLevel >= 3 ? ['aurora' as const] : []),
      ...(progress.bestLevel >= 5 ? ['solar' as const] : []),
    ],
    particleStyles: [
      'spark',
      ...(progress.bestLevel >= 3 ? ['stardust' as const] : []),
      ...(progress.gamesPlayed >= 5 ? ['confetti' as const] : []),
    ],
  };
};

export const getNextCosmeticGoal = (): string | null => {
  const progress = getPlayerProgress();
  if (progress.bestLevel < 3) return `Reach level 3 to unlock Aurora + Stardust`;
  if (progress.bestLevel < 5) return `Reach level 5 to unlock Solar`;
  if (progress.gamesPlayed < 5) return `Finish ${5 - progress.gamesPlayed} more run${5 - progress.gamesPlayed === 1 ? '' : 's'} to unlock Confetti`;
  return null;
};
