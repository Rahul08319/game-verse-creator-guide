/**
 * Safe, minimal integration with YouTube Playables SDK.
 * - Calls ytgame.game.firstFrameReady() on first animation frame if available.
 * - Calls ytgame.game.gameReady() after window load (or shortly after) when the game is interactable.
 * - Guards against missing SDK and errors.
 */

declare global {
  interface Window { ytgame?: any }
}

export function initYtgameIntegration() {
  const y = (window as any).ytgame;
  if (!y) {
    // SDK not present; nothing to do.
    console.debug('[ytgame] SDK not detected');
    return;
  }

  const safe = (fn: () => void, name?: string) => {
    try {
      fn();
      if (name) console.debug(`[ytgame] Called ${name}`);
    } catch (err) {
      console.warn(`[ytgame] ${name ?? 'call'} failed:`, err);
      try { y?.health?.logWarning?.(); } catch {};
    }
  };

  // First frame: use requestAnimationFrame so we notify after a frame has rendered.
  requestAnimationFrame(() => {
    if (y?.game?.firstFrameReady) safe(() => y.game.firstFrameReady(), 'game.firstFrameReady');
  });

  // gameReady should be called when game is interactable. Use window 'load' as a conservative hook,
  // and also fallback to a short timeout if load already fired or not present.
  const callGameReady = () => {
    if (y?.game?.gameReady) safe(() => y.game.gameReady(), 'game.gameReady');
  };

  if (document.readyState === 'complete') {
    // Page already loaded
    setTimeout(callGameReady, 200);
  } else {
    window.addEventListener('load', () => setTimeout(callGameReady, 200), { once: true });
  }

  // Expose helpers for debugging/testing
  (window as any).__ytgame_integration = { callGameReady };
}

export default initYtgameIntegration;
