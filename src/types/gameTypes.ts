
export interface Position {
  x: number;
  y: number;
}

export interface Bubble {
  id: string;
  position: Position;
  color: string;
  radius: number;
  isFixed: boolean;
  row: number;
  col: number;
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
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  bubbleRadius: number;
  colors: string[];
  rowCount: number;
  maxCols: number;
}
