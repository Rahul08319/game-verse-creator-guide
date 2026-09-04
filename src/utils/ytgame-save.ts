import { GameState } from '../types/gameTypes';

const LOCAL_KEY = 'bubble-pop-save';
const MAX_BYTES = 3 * 1024 * 1024; // 3 MiB limit per Playables spec

declare global {
  interface Window { ytgame?: any }
}

async function saveToYtgame(dataStr: string): Promise<void> {
  const y = (window as any).ytgame;
  if (!y?.game?.saveData) throw new Error('ytgame.game.saveData not available');
  await y.game.saveData(dataStr);
}

async function loadFromYtgame(): Promise<string> {
  const y = (window as any).ytgame;
  if (!y?.game?.loadData) throw new Error('ytgame.game.loadData not available');
  const s = await y.game.loadData();
  return s;
}

export async function saveGameState(state: GameState): Promise<void> {
  try {
    const dataStr = JSON.stringify(state);
    // Check size limit
    const byteLength = new TextEncoder().encode(dataStr).length;
    if (byteLength > MAX_BYTES) {
      console.warn('[ytgame-save] Serialized state exceeds 3MiB; skipping ytgame save and only saving to localStorage.');
    } else {
      try {
        await saveToYtgame(dataStr);
        console.debug('[ytgame-save] Saved state via ytgame.game.saveData');
      } catch (e) {
        console.warn('[ytgame-save] ytgame save failed, falling back to localStorage:', e);
      }
    }

    // Always persist a local fallback
    try {
      localStorage.setItem(LOCAL_KEY, dataStr);
    } catch (e) {
      console.warn('[ytgame-save] localStorage save failed:', e);
    }
  } catch (err) {
    console.error('[ytgame-save] saveGameState failed:', err);
    throw err;
  }
}

export async function loadGameState(): Promise<GameState | null> {
  // Try ytgame load first
  try {
    const y = (window as any).ytgame;
    if (y?.game?.loadData) {
      try {
        const s = await loadFromYtgame();
        if (s) {
          const parsed = JSON.parse(s) as GameState;
          console.debug('[ytgame-save] Loaded state from ytgame');
          return parsed;
        }
      } catch (err) {
        console.warn('[ytgame-save] ytgame loadData failed:', err);
      }
    }
  } catch (err) {
    console.warn('[ytgame-save] ytgame load attempt threw:', err);
  }

  // Fallback to localStorage
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const parsed = JSON.parse(s) as GameState;
      console.debug('[ytgame-save] Loaded state from localStorage');
      return parsed;
    }
  } catch (err) {
    console.warn('[ytgame-save] localStorage load failed:', err);
  }

  return null;
}

export default { saveGameState, loadGameState };