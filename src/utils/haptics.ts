let enabled = true;

export const Haptics = {
  pop() {
    if (!enabled) return;
    navigator?.vibrate?.(15);
  },
  combo(level: number) {
    if (!enabled) return;
    const pattern = level >= 3 ? [30, 50, 30, 50, 50] : [20, 30, 20];
    navigator?.vibrate?.(pattern);
  },
  shoot() {
    if (!enabled) return;
    navigator?.vibrate?.(10);
  },
  levelUp() {
    if (!enabled) return;
    navigator?.vibrate?.([40, 60, 40, 60, 80]);
  },
  gameOver() {
    if (!enabled) return;
    navigator?.vibrate?.([100, 50, 100, 50, 200]);
  },
  explosion() {
    if (!enabled) return;
    navigator?.vibrate?.(40);
  },
  setEnabled(value: boolean) { enabled = value; if (!enabled) navigator?.vibrate?.(0); },
  isEnabled: () => enabled,
};
