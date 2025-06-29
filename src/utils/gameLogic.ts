
import { GameState, Bubble, Position, GameConfig } from '../types/gameTypes';

const GAME_CONFIG: GameConfig = {
  canvasWidth: 350,
  canvasHeight: 500,
  bubbleRadius: 18,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
  rowCount: 8,
  maxCols: 10
};

export const initializeGame = (): GameState => {
  const bubbles = generateInitialBubbles();
  
  return {
    bubbles,
    currentBubble: createRandomBubble(),
    nextBubble: createRandomBubble(),
    score: 0,
    level: 1,
    lives: 3,
    isGameOver: false,
    isPaused: false
  };
};

const generateInitialBubbles = (): Bubble[] => {
  const bubbles: Bubble[] = [];
  const { canvasWidth, bubbleRadius, maxCols, colors } = GAME_CONFIG;
  
  for (let row = 0; row < 6; row++) {
    const colsInRow = maxCols - (row % 2);
    const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
    
    for (let col = 0; col < colsInRow; col++) {
      const x = startX + col * bubbleRadius * 2 + (row % 2) * bubbleRadius;
      const y = 50 + row * bubbleRadius * 1.8;
      
      bubbles.push({
        id: `${row}-${col}`,
        position: { x, y },
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: bubbleRadius,
        isFixed: true,
        row,
        col
      });
    }
  }
  
  return bubbles;
};

const createRandomBubble = (): Bubble => {
  const { colors, bubbleRadius, canvasWidth } = GAME_CONFIG;
  
  return {
    id: `bubble-${Date.now()}-${Math.random()}`,
    position: { x: canvasWidth / 2, y: GAME_CONFIG.canvasHeight - 30 },
    color: colors[Math.floor(Math.random() * colors.length)],
    radius: bubbleRadius,
    isFixed: false,
    row: -1,
    col: -1
  };
};

export const updateGameState = (gameState: GameState, shootAngle: number): GameState => {
  if (!gameState.currentBubble) return gameState;

  const newBubbles = [...gameState.bubbles];
  const shootingBubble = { ...gameState.currentBubble };
  
  // Calculate trajectory
  const speed = 8;
  const trajectory = simulateTrajectory(shootingBubble.position, shootAngle, speed, newBubbles);
  
  if (trajectory.length > 0) {
    const finalPosition = trajectory[trajectory.length - 1];
    const attachPosition = findAttachPosition(finalPosition, newBubbles);
    
    if (attachPosition) {
      shootingBubble.position = attachPosition.position;
      shootingBubble.row = attachPosition.row;
      shootingBubble.col = attachPosition.col;
      shootingBubble.isFixed = true;
      
      newBubbles.push(shootingBubble);
      
      // Check for matches
      const matchedBubbles = findMatches(shootingBubble, newBubbles);
      let score = gameState.score;
      
      if (matchedBubbles.length >= 3) {
        // Remove matched bubbles
        const remainingBubbles = newBubbles.filter(bubble => 
          !matchedBubbles.some(matched => matched.id === bubble.id)
        );
        
        // Remove floating bubbles
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));
        
        // Calculate score
        score += matchedBubbles.length * 10 + (newBubbles.length - finalBubbles.length - matchedBubbles.length) * 5;
        
        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(),
          score
        };
      }
    }
  }
  
  return {
    ...gameState,
    bubbles: newBubbles,
    currentBubble: gameState.nextBubble,
    nextBubble: createRandomBubble()
  };
};

const simulateTrajectory = (start: Position, angle: number, speed: number, obstacles: Bubble[]): Position[] => {
  const trajectory: Position[] = [];
  let pos = { ...start };
  const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
  
  for (let i = 0; i < 100; i++) {
    pos.x += velocity.x;
    pos.y += velocity.y;
    
    // Wall collision
    if (pos.x <= GAME_CONFIG.bubbleRadius || pos.x >= GAME_CONFIG.canvasWidth - GAME_CONFIG.bubbleRadius) {
      velocity.x *= -1;
      pos.x = Math.max(GAME_CONFIG.bubbleRadius, Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.bubbleRadius, pos.x));
    }
    
    // Check collision with bubbles
    const collision = obstacles.find(bubble => {
      const dx = pos.x - bubble.position.x;
      const dy = pos.y - bubble.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= GAME_CONFIG.bubbleRadius * 2;
    });
    
    if (collision || pos.y <= GAME_CONFIG.bubbleRadius) {
      break;
    }
    
    trajectory.push({ ...pos });
  }
  
  return trajectory;
};

const findAttachPosition = (position: Position, bubbles: Bubble[]): { position: Position; row: number; col: number } | null => {
  // Find the best grid position to attach the bubble
  const { bubbleRadius, canvasWidth } = GAME_CONFIG;
  
  // Find the topmost row that has bubbles
  const maxRow = Math.max(-1, ...bubbles.map(b => b.row));
  const targetRow = maxRow + 1;
  
  // Calculate grid position
  const colsInRow = GAME_CONFIG.maxCols - (targetRow % 2);
  const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
  
  // Find closest column
  let bestCol = 0;
  let minDistance = Infinity;
  
  for (let col = 0; col < colsInRow; col++) {
    const gridX = startX + col * bubbleRadius * 2 + (targetRow % 2) * bubbleRadius;
    const distance = Math.abs(position.x - gridX);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestCol = col;
    }
  }
  
  const finalX = startX + bestCol * bubbleRadius * 2 + (targetRow % 2) * bubbleRadius;
  const finalY = 50 + targetRow * bubbleRadius * 1.8;
  
  return {
    position: { x: finalX, y: finalY },
    row: targetRow,
    col: bestCol
  };
};

const findMatches = (bubble: Bubble, bubbles: Bubble[]): Bubble[] => {
  const visited = new Set<string>();
  const matches: Bubble[] = [];
  
  const dfs = (current: Bubble) => {
    if (visited.has(current.id) || current.color !== bubble.color) return;
    
    visited.add(current.id);
    matches.push(current);
    
    // Check adjacent bubbles
    const neighbors = getNeighbors(current, bubbles);
    neighbors.forEach(neighbor => dfs(neighbor));
  };
  
  dfs(bubble);
  return matches;
};

const getNeighbors = (bubble: Bubble, bubbles: Bubble[]): Bubble[] => {
  const { row, col } = bubble;
  const neighbors: Bubble[] = [];
  
  // Define neighbor offsets based on row parity
  const offsets = row % 2 === 0 ? [
    [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
  ] : [
    [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
  ];
  
  offsets.forEach(([dr, dc]) => {
    const neighbor = bubbles.find(b => b.row === row + dr && b.col === col + dc);
    if (neighbor) neighbors.push(neighbor);
  });
  
  return neighbors;
};

const findConnectedBubbles = (bubbles: Bubble[]): Set<string> => {
  const connected = new Set<string>();
  const topRowBubbles = bubbles.filter(b => b.row === 0);
  
  const dfs = (bubble: Bubble) => {
    if (connected.has(bubble.id)) return;
    
    connected.add(bubble.id);
    const neighbors = getNeighbors(bubble, bubbles);
    neighbors.forEach(neighbor => dfs(neighbor));
  };
  
  topRowBubbles.forEach(bubble => dfs(bubble));
  return connected;
};

export const checkGameOver = (gameState: GameState): boolean => {
  const bottommostBubble = gameState.bubbles.reduce((max, bubble) => 
    bubble.position.y > max ? bubble.position.y : max, 0
  );
  
  return bottommostBubble >= GAME_CONFIG.canvasHeight - 100;
};
