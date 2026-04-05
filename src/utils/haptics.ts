
export const Haptics = {
  pop() {
    navigator?.vibrate?.(15);
  },
  combo(level: number) {
    const pattern = level >= 3 ? [30, 50, 30, 50, 50] : [20, 30, 20];
    navigator?.vibrate?.(pattern);
  },
  shoot() {
    navigator?.vibrate?.(10);
  },
  levelUp() {
    navigator?.vibrate?.([40, 60, 40, 60, 80]);
  },
  gameOver() {
    navigator?.vibrate?.([100, 50, 100, 50, 200]);
  },
  explosion() {
    navigator?.vibrate?.(40);
  },
};
