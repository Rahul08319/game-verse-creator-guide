
export interface Position {
  x: number;
  y: number;
}

export type PowerUpType = 'bomb' | 'rainbow' | 'freeze' | null;

export interface Bubble {
  id: string;
  position: Position;
  color: string;
  radius: number;
  isFixed: boolean;
  row: number;
  col: number;
  powerUp?: PowerUpType;
}

export interface Particle {
  id: string;
  position: Position;
  velocity: Position;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
  type: 'explosion' | 'trail' | 'combo';
}

export interface ComboText {
  id: string;
  position: Position;
  text: string;
  life: number;
  scale: number;
}

export interface GameState {
  bubbles: Bubble[];
  currentBubble: Bubble | null;
  nextBubble: Bubble | null;
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  isFrozen: boolean;
  frozenTimer: number;
  particles: Particle[];
  comboTexts: ComboText[];
  combo: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  bubbleRadius: number;
  colors: string[];
  neonColors: string[];
  rowCount: number;
  maxCols: number;
}
