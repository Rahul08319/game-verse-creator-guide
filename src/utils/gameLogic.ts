import { GameState, Bubble, Position, GameConfig, Particle, ComboText, PowerUpType } from '../types/gameTypes';

const GAME_CONFIG: GameConfig = {
  canvasWidth: 350,
  canvasHeight: 500,
  bubbleRadius: 18,
  colors: ['#FF0080', '#00FFFF', '#00FF41', '#FFFF00', '#FF00FF', '#FF6600', '#0080FF'],
  neonColors: ['#FF0080', '#00FFFF', '#00FF41', '#FFFF00', '#FF00FF', '#FF6600', '#0080FF'],
  rowCount: 8,
  maxCols: 10
};

const POWER_UP_CHANCE = 0.08;

// Level definitions
interface LevelDef {
  rows: number;
  colorsUsed: number; // how many colors from the palette
  powerUpChance: number;
  pattern: 'random' | 'striped' | 'checkerboard' | 'diamond' | 'fortress';
  targetScore: number; // score needed to advance
}

const LEVELS: LevelDef[] = [
  { rows: 4, colorsUsed: 4, powerUpChance: 0.10, pattern: 'random', targetScore: 200 },
  { rows: 5, colorsUsed: 4, powerUpChance: 0.08, pattern: 'striped', targetScore: 500 },
  { rows: 5, colorsUsed: 5, powerUpChance: 0.08, pattern: 'checkerboard', targetScore: 900 },
  { rows: 6, colorsUsed: 5, powerUpChance: 0.06, pattern: 'random', targetScore: 1400 },
  { rows: 6, colorsUsed: 6, powerUpChance: 0.06, pattern: 'diamond', targetScore: 2000 },
  { rows: 7, colorsUsed: 6, powerUpChance: 0.05, pattern: 'fortress', targetScore: 2800 },
  { rows: 7, colorsUsed: 7, powerUpChance: 0.05, pattern: 'striped', targetScore: 3800 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.04, pattern: 'checkerboard', targetScore: 5000 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.03, pattern: 'diamond', targetScore: 6500 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.03, pattern: 'fortress', targetScore: 8500 },
];

const getLevelDef = (level: number): LevelDef => {
  const idx = Math.min(level - 1, LEVELS.length - 1);
  return LEVELS[idx];
};

export const getTargetScore = (level: number): number => getLevelDef(level).targetScore;

export const initializeGame = (level: number = 1, carryScore: number = 0): GameState => {
  const bubbles = generateLevelBubbles(level);

  return {
    bubbles,
    currentBubble: createRandomBubble(level),
    nextBubble: createRandomBubble(level),
    score: carryScore,
    level,
    lives: 3,
    isGameOver: false,
    isPaused: false,
    isFrozen: false,
    frozenTimer: 0,
    particles: [],
    comboTexts: [],
    combo: 0
  };
};

const generateLevelBubbles = (level: number): Bubble[] => {
  const def = getLevelDef(level);
  const { canvasWidth, bubbleRadius, maxCols, colors } = GAME_CONFIG;
  const levelColors = colors.slice(0, def.colorsUsed);
  const bubbles: Bubble[] = [];

  for (let row = 0; row < def.rows; row++) {
    const colsInRow = maxCols - (row % 2);
    const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;

    for (let col = 0; col < colsInRow; col++) {
      // Pattern-based skip
      if (shouldSkipCell(def.pattern, row, col, colsInRow, def.rows)) continue;

      const x = startX + col * bubbleRadius * 2 + (row % 2) * bubbleRadius;
      const y = 50 + row * bubbleRadius * 1.8;

      const color = getPatternColor(def.pattern, row, col, levelColors);

      bubbles.push({
        id: `${row}-${col}`,
        position: { x, y },
        color,
        radius: bubbleRadius,
        isFixed: true,
        row,
        col,
        powerUp: null
      });
    }
  }

  return bubbles;
};

const shouldSkipCell = (pattern: string, row: number, col: number, colsInRow: number, totalRows: number): boolean => {
  if (pattern === 'diamond') {
    const centerCol = Math.floor(colsInRow / 2);
    const dist = Math.abs(col - centerCol);
    const maxDist = Math.floor(totalRows / 2) + 1;
    const allowedDist = row < totalRows / 2 ? row + 1 : totalRows - row;
    return dist > allowedDist;
  }
  if (pattern === 'fortress') {
    // Leave gaps in the middle rows
    if (row >= 2 && row <= 4 && col >= 3 && col <= 5) return true;
  }
  return false;
};

const getPatternColor = (pattern: string, row: number, col: number, colors: string[]): string => {
  switch (pattern) {
    case 'striped':
      return colors[row % colors.length];
    case 'checkerboard':
      return colors[(row + col) % colors.length];
    default:
      return colors[Math.floor(Math.random() * colors.length)];
  }
};

const createRandomBubble = (level: number = 1): Bubble => {
  const def = getLevelDef(level);
  const levelColors = GAME_CONFIG.colors.slice(0, def.colorsUsed);
  const { bubbleRadius, canvasWidth } = GAME_CONFIG;

  let powerUp: PowerUpType = null;
  if (Math.random() < def.powerUpChance) {
    const powerUps: PowerUpType[] = ['bomb', 'rainbow', 'freeze'];
    powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
  }

  return {
    id: `bubble-${Date.now()}-${Math.random()}`,
    position: { x: canvasWidth / 2, y: GAME_CONFIG.canvasHeight - 30 },
    color: levelColors[Math.floor(Math.random() * levelColors.length)],
    radius: bubbleRadius,
    isFixed: false,
    row: -1,
    col: -1,
    powerUp
  };
};

export const createExplosionParticles = (position: Position, color: string, count: number = 12): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: `particle-${Date.now()}-${i}`,
      position: { ...position },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color,
      radius: 4 + Math.random() * 4,
      life: 40 + Math.random() * 20,
      maxLife: 60,
      type: 'explosion'
    });
  }
  return particles;
};

export const createComboParticles = (position: Position, color: string): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      id: `combo-particle-${Date.now()}-${i}`,
      position: { ...position },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 2 },
      color: ['#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 3)],
      radius: 6 + Math.random() * 4,
      life: 50,
      maxLife: 50,
      type: 'combo'
    });
  }
  return particles;
};

export const createComboText = (position: Position, combo: number): ComboText => {
  const texts = ['NICE!', 'GREAT!', 'AMAZING!', 'INCREDIBLE!', 'LEGENDARY!'];
  const text = combo >= 5 ? texts[4] : texts[Math.min(combo - 1, 4)];
  return {
    id: `combo-${Date.now()}`,
    position: { x: position.x, y: position.y - 20 },
    text: `${text} x${combo}`,
    life: 60,
    scale: 1 + (combo - 1) * 0.2
  };
};

export const updateParticles = (particles: Particle[]): Particle[] => {
  return particles
    .map(p => ({
      ...p,
      position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y },
      velocity: { x: p.velocity.x * 0.95, y: p.velocity.y * 0.95 + 0.1 },
      life: p.life - 1
    }))
    .filter(p => p.life > 0);
};

export const updateComboTexts = (comboTexts: ComboText[]): ComboText[] => {
  return comboTexts
    .map(t => ({ ...t, position: { ...t.position, y: t.position.y - 1 }, life: t.life - 1, scale: t.scale + 0.02 }))
    .filter(t => t.life > 0);
};

export const updateGameState = (gameState: GameState, shootAngle: number): GameState => {
  if (!gameState.currentBubble) return gameState;

  const newBubbles = [...gameState.bubbles];
  const shootingBubble = { ...gameState.currentBubble };
  let newParticles = [...gameState.particles];
  let newComboTexts = [...gameState.comboTexts];
  let newCombo = 0;
  let isFrozen = gameState.isFrozen;
  let frozenTimer = gameState.frozenTimer;
  const level = gameState.level;

  const speed = 8;
  const { trajectory, hitBubble, hitTop } = simulateTrajectory(shootingBubble.position, shootAngle, speed, newBubbles);

  if (trajectory.length > 0 || hitBubble || hitTop) {
    const finalPosition = trajectory.length > 0 ? trajectory[trajectory.length - 1] : shootingBubble.position;
    const attachPosition = findAttachPosition(finalPosition, newBubbles, hitBubble);

    if (attachPosition) {
      shootingBubble.position = attachPosition.position;
      shootingBubble.row = attachPosition.row;
      shootingBubble.col = attachPosition.col;
      shootingBubble.isFixed = true;

      // Handle power-ups
      if (shootingBubble.powerUp === 'bomb') {
        const bombRadius = GAME_CONFIG.bubbleRadius * 4;
        const affectedBubbles = newBubbles.filter(bubble => {
          const dx = bubble.position.x - shootingBubble.position.x;
          const dy = bubble.position.y - shootingBubble.position.y;
          return Math.sqrt(dx * dx + dy * dy) <= bombRadius;
        });
        affectedBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color, 8)];
        });
        newParticles = [...newParticles, ...createExplosionParticles(shootingBubble.position, '#FF6600', 20)];
        const remainingBubbles = newBubbles.filter(bubble => !affectedBubbles.includes(bubble));
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));
        const score = gameState.score + affectedBubbles.length * 15 + (remainingBubbles.length - finalBubbles.length) * 10;

        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(level),
          score,
          particles: newParticles,
          comboTexts: newComboTexts,
          soundEvent: 'bomb' as const
        };

      } else if (shootingBubble.powerUp === 'freeze') {
        isFrozen = true;
        frozenTimer = 180;
        newParticles = [...newParticles, ...createExplosionParticles(shootingBubble.position, '#00FFFF', 15)];
        return {
          ...gameState,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(level),
          isFrozen,
          frozenTimer,
          particles: newParticles,
          comboTexts: newComboTexts,
          soundEvent: 'freeze' as const
        };

      } else if (shootingBubble.powerUp === 'rainbow') {
        const neighbors = getNeighbors(shootingBubble, newBubbles);
        if (neighbors.length > 0) {
          const colorCounts: Record<string, number> = {};
          neighbors.forEach(n => { colorCounts[n.color] = (colorCounts[n.color] || 0) + 1; });
          const bestColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (bestColor) shootingBubble.color = bestColor;
        }
        shootingBubble.powerUp = null;
      }

      newBubbles.push(shootingBubble);

      const matchedBubbles = findMatches(shootingBubble, newBubbles);
      let score = gameState.score;
      let soundEvent: string = 'attach';

      if (matchedBubbles.length >= 3) {
        matchedBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color)];
        });
        const remainingBubbles = newBubbles.filter(bubble => !matchedBubbles.some(matched => matched.id === bubble.id));
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const floatingBubbles = remainingBubbles.filter(bubble => !connectedBubbles.has(bubble.id));
        floatingBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color, 6)];
        });
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));

        newCombo = gameState.combo + 1;
        const comboMultiplier = 1 + (newCombo - 1) * 0.5;
        const baseScore = matchedBubbles.length * 10 + floatingBubbles.length * 5;
        score += Math.floor(baseScore * comboMultiplier);

        soundEvent = newCombo >= 2 ? `combo-${newCombo}` : 'pop';

        if (newCombo >= 2) {
          const centerPos = {
            x: matchedBubbles.reduce((sum, b) => sum + b.position.x, 0) / matchedBubbles.length,
            y: matchedBubbles.reduce((sum, b) => sum + b.position.y, 0) / matchedBubbles.length
          };
          newComboTexts = [...newComboTexts, createComboText(centerPos, newCombo)];
          newParticles = [...newParticles, ...createComboParticles(centerPos, '#FFFF00')];
        }

        // Check level complete
        const levelDef = getLevelDef(level);
        const levelComplete = finalBubbles.length === 0 || score >= levelDef.targetScore;

        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(level),
          score,
          particles: newParticles,
          comboTexts: newComboTexts,
          combo: newCombo,
          soundEvent,
          levelComplete
        };
      }

      return {
        ...gameState,
        bubbles: newBubbles,
        currentBubble: gameState.nextBubble,
        nextBubble: createRandomBubble(level),
        score,
        particles: newParticles,
        comboTexts: newComboTexts,
        combo: 0,
        soundEvent
      };
    }
  }

  return {
    ...gameState,
    bubbles: newBubbles,
    currentBubble: gameState.nextBubble,
    nextBubble: createRandomBubble(level),
    particles: newParticles,
    comboTexts: newComboTexts,
    combo: 0,
    soundEvent: 'shoot'
  };
};

const simulateTrajectory = (start: Position, angle: number, speed: number, obstacles: Bubble[]): { trajectory: Position[], hitBubble: Bubble | null, hitTop: boolean } => {
  const trajectory: Position[] = [];
  let pos = { ...start };
  const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
  let hitBubble: Bubble | null = null;
  let hitTop = false;

  for (let i = 0; i < 150; i++) {
    pos.x += velocity.x;
    pos.y += velocity.y;

    if (pos.x <= GAME_CONFIG.bubbleRadius || pos.x >= GAME_CONFIG.canvasWidth - GAME_CONFIG.bubbleRadius) {
      velocity.x *= -1;
      pos.x = Math.max(GAME_CONFIG.bubbleRadius, Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.bubbleRadius, pos.x));
    }

    const collision = obstacles.find(bubble => {
      const dx = pos.x - bubble.position.x;
      const dy = pos.y - bubble.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= GAME_CONFIG.bubbleRadius * 1.9;
    });

    if (collision) { hitBubble = collision; break; }
    if (pos.y <= GAME_CONFIG.bubbleRadius + 30) { hitTop = true; break; }
    trajectory.push({ ...pos });
  }

  return { trajectory, hitBubble, hitTop };
};

const findAttachPosition = (position: Position, bubbles: Bubble[], hitBubble: Bubble | null): { position: Position; row: number; col: number } | null => {
  const { bubbleRadius, canvasWidth } = GAME_CONFIG;

  if (hitBubble) {
    const { row: hitRow, col: hitCol } = hitBubble;
    const offsets = hitRow % 2 === 0 ? [
      [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ] : [
      [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ];

    let bestPos: { row: number; col: number; dist: number } | null = null;

    for (const [dr, dc] of offsets) {
      const newRow = hitRow + dr;
      const newCol = hitCol + dc;
      const colsInRow = GAME_CONFIG.maxCols - (newRow % 2);
      if (newCol < 0 || newCol >= colsInRow || newRow < 0) continue;
      const occupied = bubbles.some(b => b.row === newRow && b.col === newCol);
      if (occupied) continue;

      const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
      const posX = startX + newCol * bubbleRadius * 2 + (newRow % 2) * bubbleRadius;
      const posY = 50 + newRow * bubbleRadius * 1.8;
      const dist = Math.sqrt(Math.pow(position.x - posX, 2) + Math.pow(position.y - posY, 2));

      if (!bestPos || dist < bestPos.dist) {
        bestPos = { row: newRow, col: newCol, dist };
      }
    }

    if (bestPos) {
      const colsInRow = GAME_CONFIG.maxCols - (bestPos.row % 2);
      const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
      const finalX = startX + bestPos.col * bubbleRadius * 2 + (bestPos.row % 2) * bubbleRadius;
      const finalY = 50 + bestPos.row * bubbleRadius * 1.8;
      return { position: { x: finalX, y: finalY }, row: bestPos.row, col: bestPos.col };
    }
  }

  // Fallback: top row
  const row = 0;
  const colsInRow = GAME_CONFIG.maxCols - (row % 2);
  const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
  let bestCol = 0;
  let minDistance = Infinity;
  for (let col = 0; col < colsInRow; col++) {
    const gridX = startX + col * bubbleRadius * 2;
    const occupied = bubbles.some(b => b.row === row && b.col === col);
    if (occupied) continue;
    const distance = Math.abs(position.x - gridX);
    if (distance < minDistance) { minDistance = distance; bestCol = col; }
  }
  return {
    position: { x: startX + bestCol * bubbleRadius * 2, y: 50 + row * bubbleRadius * 1.8 },
    row,
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
    getNeighbors(current, bubbles).forEach(neighbor => dfs(neighbor));
  };
  dfs(bubble);
  return matches;
};

const getNeighbors = (bubble: Bubble, bubbles: Bubble[]): Bubble[] => {
  const { row, col } = bubble;
  const neighbors: Bubble[] = [];
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
    getNeighbors(bubble, bubbles).forEach(neighbor => dfs(neighbor));
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
