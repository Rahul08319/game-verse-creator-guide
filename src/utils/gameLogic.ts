import { GameState, Bubble, Position, GameConfig, Particle, ComboText, PowerUpType } from '../types/gameTypes';

// Theme color palettes
const THEME_PALETTES = {
  neon: ['#FF0080', '#00FFFF', '#00FF41', '#FFFF00', '#FF00FF', '#FF6600', '#0080FF'],
  retro: ['#FF6600', '#FFFF00', '#00FF41', '#FF3333', '#CC66FF', '#33CCFF', '#FF9933'],
  ocean: ['#0080FF', '#00CCCC', '#6600FF', '#0066AA', '#33AADD', '#9966FF', '#00AAAA'],
  aurora: ['#7DF9FF', '#B388FF', '#69F0AE', '#FF80AB', '#FFE57F', '#40C4FF', '#EA80FC'],
  solar: ['#FF6B35', '#F7C948', '#FAD02E', '#FF8FAB', '#D65DB1', '#845EC2', '#4D8076'],
};

export type ThemeName = keyof typeof THEME_PALETTES;

const COLOR_BLIND_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442'];

const THEME_BACKGROUNDS = {
  neon: { top: '#0a0a1a', mid: '#1a0a2e', bottom: '#0a1a2e', glow1: 'rgba(255, 0, 128, 0.15)', glow2: 'rgba(0, 255, 255, 0.15)', grid: 'rgba(255, 0, 255, 0.05)' },
  retro: { top: '#1a1a0a', mid: '#2e1a0a', bottom: '#1a2e0a', glow1: 'rgba(255, 102, 0, 0.15)', glow2: 'rgba(255, 255, 0, 0.15)', grid: 'rgba(255, 153, 0, 0.05)' },
  ocean: { top: '#0a0a2e', mid: '#0a1a3e', bottom: '#0a2e3e', glow1: 'rgba(0, 128, 255, 0.15)', glow2: 'rgba(102, 0, 255, 0.15)', grid: 'rgba(0, 128, 255, 0.05)' },
  aurora: { top: '#071b2e', mid: '#15265b', bottom: '#143d3b', glow1: 'rgba(125, 249, 255, 0.2)', glow2: 'rgba(179, 136, 255, 0.2)', grid: 'rgba(105, 240, 174, 0.08)' },
  solar: { top: '#2b1027', mid: '#662642', bottom: '#2a1b4a', glow1: 'rgba(255, 107, 53, 0.22)', glow2: 'rgba(247, 201, 72, 0.18)', grid: 'rgba(255, 143, 171, 0.08)' },
};

let currentTheme: ThemeName = 'neon';
let colorBlindMode = false;
export type ParticleStyle = 'spark' | 'stardust' | 'confetti';
let particleStyle: ParticleStyle = 'spark';

export const setTheme = (t: ThemeName) => { currentTheme = t; };
export const setColorBlindMode = (enabled: boolean) => { colorBlindMode = enabled; };
export const setParticleStyle = (style: ParticleStyle) => { particleStyle = style; };
export const getParticleStyle = () => particleStyle;
export const getTheme = () => currentTheme;
export const getThemeColors = () => colorBlindMode ? COLOR_BLIND_PALETTE : THEME_PALETTES[currentTheme];
export const getThemeBackground = () => THEME_BACKGROUNDS[currentTheme];

const getGameConfig = (): GameConfig => ({
  canvasWidth: 350,
  canvasHeight: 500,
  bubbleRadius: 18,
  colors: getThemeColors(),
  neonColors: getThemeColors(),
  rowCount: 8,
  maxCols: 10
});

const POWER_UP_CHANCE = 0.08;

// Level definitions
interface LevelDef {
  rows: number;
  colorsUsed: number;
  powerUpChance: number;
  pattern: 'random' | 'striped' | 'checkerboard' | 'diamond' | 'fortress';
  targetScore: number;
  boss?: { name: string; color: string };
}

const LEVELS: LevelDef[] = [
  { rows: 4, colorsUsed: 4, powerUpChance: 0.10, pattern: 'random', targetScore: 200 },
  { rows: 5, colorsUsed: 4, powerUpChance: 0.08, pattern: 'striped', targetScore: 500 },
  { rows: 5, colorsUsed: 5, powerUpChance: 0.08, pattern: 'checkerboard', targetScore: 900 },
  { rows: 6, colorsUsed: 5, powerUpChance: 0.06, pattern: 'random', targetScore: 1400 },
  { rows: 6, colorsUsed: 6, powerUpChance: 0.06, pattern: 'diamond', targetScore: 2000, boss: { name: 'Prism Warden', color: '#FFD166' } },
  { rows: 7, colorsUsed: 6, powerUpChance: 0.05, pattern: 'fortress', targetScore: 2800 },
  { rows: 7, colorsUsed: 7, powerUpChance: 0.05, pattern: 'striped', targetScore: 3800 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.04, pattern: 'checkerboard', targetScore: 5000 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.03, pattern: 'diamond', targetScore: 6500 },
  { rows: 8, colorsUsed: 7, powerUpChance: 0.03, pattern: 'fortress', targetScore: 8500, boss: { name: 'Nova Sentinel', color: '#FF70D1' } },
];

const getLevelDef = (level: number): LevelDef => {
  const idx = Math.min(level - 1, LEVELS.length - 1);
  const baseDef = LEVELS[idx];
  const mod = DIFFICULTY_MODS[currentDifficulty];
  return {
    ...baseDef,
    rows: Math.max(2, baseDef.rows - mod.rowReduction),
    colorsUsed: Math.max(2, Math.min(7, baseDef.colorsUsed - mod.colorReduction)),
    powerUpChance: Math.max(0.01, baseDef.powerUpChance + mod.powerUpBoost),
  };
};

export const getTargetScore = (level: number): number => getLevelDef(level).targetScore;
export const getBossForLevel = (level: number) => getLevelDef(level).boss;

// Difficulty modifiers
const DIFFICULTY_MODS = {
  easy: { colorReduction: 1, powerUpBoost: 0.04, rowReduction: 1 },
  normal: { colorReduction: 0, powerUpBoost: 0, rowReduction: 0 },
  hard: { colorReduction: -1, powerUpBoost: -0.02, rowReduction: -1 },
};

let currentDifficulty: 'easy' | 'normal' | 'hard' = 'normal';

export const setDifficulty = (d: 'easy' | 'normal' | 'hard') => { currentDifficulty = d; };

// Seeded random for daily challenge
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

let seededRng: SeededRandom | null = null;

export const getDailySeed = (): number => {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
};

export const getWeeklySeed = (): number => {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return utc.getUTCFullYear() * 100 + week;
};

const getRandom = (): number => {
  if (seededRng) return seededRng.next();
  return Math.random();
};

export const initializeGame = (level: number = 1, carryScore: number = 0, challengeMode: 'daily' | 'weekly' | boolean = false): GameState => {
  if (challengeMode) {
    const seed = challengeMode === 'weekly' ? getWeeklySeed() : getDailySeed();
    seededRng = new SeededRandom(seed + level * 1000);
  } else {
    seededRng = null;
  }
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
    combo: 0,
    shotsFired: 0,
    successfulShots: 0,
    adaptiveTier: 0,
    isBossLevel: Boolean(getLevelDef(level).boss),
    bossName: getLevelDef(level).boss?.name,
    bossDefeated: false,
  };
};

const generateLevelBubbles = (level: number): Bubble[] => {
  const def = getLevelDef(level);
  const config = getGameConfig();
  const { canvasWidth, bubbleRadius, maxCols } = config;
  const levelColors = config.colors.slice(0, def.colorsUsed);
  const bubbles: Bubble[] = [];

  for (let row = 0; row < def.rows; row++) {
    const colsInRow = maxCols - (row % 2);
    const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;

    for (let col = 0; col < colsInRow; col++) {
      if (shouldSkipCell(def.pattern, row, col, colsInRow, def.rows)) continue;

      const x = startX + col * bubbleRadius * 2 + (row % 2) * bubbleRadius;
      const y = 50 + row * bubbleRadius * 1.8;

      const color = getPatternColor(def.pattern, row, col, levelColors);

      const boss = def.boss && row === Math.min(2, def.rows - 1) && col === Math.floor(colsInRow / 2);
      bubbles.push({
        id: `${row}-${col}`,
        position: { x, y },
        color: boss ? def.boss.color : color,
        radius: bubbleRadius,
        isFixed: true,
        row,
        col,
        powerUp: boss ? 'boss' : null,
        isBoss: Boolean(boss)
      });
    }
  }

  return bubbles;
};

const shouldSkipCell = (pattern: string, row: number, col: number, colsInRow: number, totalRows: number): boolean => {
  if (pattern === 'diamond') {
    const centerCol = Math.floor(colsInRow / 2);
    const dist = Math.abs(col - centerCol);
    const allowedDist = row < totalRows / 2 ? row + 1 : totalRows - row;
    return dist > allowedDist;
  }
  if (pattern === 'fortress') {
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
      return colors[Math.floor(getRandom() * colors.length)];
  }
};

const createRandomBubble = (level: number = 1): Bubble => {
  const def = getLevelDef(level);
  const config = getGameConfig();
  const levelColors = [...config.colors.slice(0, def.colorsUsed), ...(def.boss ? [def.boss.color] : [])];
  const { bubbleRadius, canvasWidth } = config;

  let powerUp: PowerUpType = null;
  if (getRandom() < def.powerUpChance) {
    const powerUps: PowerUpType[] = ['bomb', 'rainbow', 'freeze', 'nova'];
    powerUp = powerUps[Math.floor(getRandom() * powerUps.length)];
  }

  return {
    id: `bubble-${Date.now()}-${getRandom()}`,
    position: { x: canvasWidth / 2, y: config.canvasHeight - 30 },
    color: levelColors[Math.floor(getRandom() * levelColors.length)],
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
      color: particleStyle === 'confetti'
        ? ['#FF6B35', '#F7C948', '#69F0AE', '#40C4FF', '#EA80FC'][Math.floor(Math.random() * 5)]
        : particleStyle === 'stardust' ? '#F7E7A9' : ['#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 3)],
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

/**
 * Adjusts the next shot from the player's live accuracy. A struggling player
 * receives a colour-match assist and occasional power-up; a very accurate
 * player receives a full-palette shot. This is intentionally gentle so the
 * game never changes its selected difficulty setting behind their back.
 */
export const applyAdaptiveDifficulty = (previous: GameState, next: GameState): GameState => {
  const shotsFired = (previous.shotsFired ?? 0) + 1;
  const popped = Math.max(0, previous.bubbles.length - next.bubbles.length);
  const successfulShots = (previous.successfulShots ?? 0) + (popped >= 3 ? 1 : 0);
  const accuracy = successfulShots / shotsFired;
  const adaptiveTier: -1 | 0 | 1 = shotsFired < 3 ? 0 : accuracy <= 0.33 ? -1 : accuracy >= 0.7 ? 1 : 0;
  let nextBubble = next.nextBubble;

  if (nextBubble && adaptiveTier === -1) {
    const colorCounts = new Map<string, number>();
    next.bubbles.forEach(bubble => colorCounts.set(bubble.color, (colorCounts.get(bubble.color) ?? 0) + 1));
    const helpfulColor = [...colorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    nextBubble = {
      ...nextBubble,
      color: helpfulColor ?? nextBubble.color,
      powerUp: nextBubble.powerUp ?? (shotsFired % 3 === 0 ? 'rainbow' : null),
    };
  } else if (nextBubble && adaptiveTier === 1) {
    const colors = getThemeColors();
    nextBubble = { ...nextBubble, color: colors[Math.floor(getRandom() * colors.length)], powerUp: null };
  }

  return { ...next, shotsFired, successfulShots, adaptiveTier, nextBubble };
};

export const updateGameState = (gameState: GameState, shootAngle: number): GameState => {
  if (!gameState.currentBubble) return gameState;

  const config = getGameConfig();
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
        const bombRadius = config.bubbleRadius * 4;
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

      } else if (shootingBubble.powerUp === 'nova') {
        const targetColor = [...newBubbles].sort((a, b) =>
          newBubbles.filter(bubble => bubble.color === b.color).length - newBubbles.filter(bubble => bubble.color === a.color).length
        )[0]?.color;
        const affectedBubbles = newBubbles.filter(bubble => bubble.color === targetColor && !bubble.isBoss);
        affectedBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, '#F7C948', 10)];
        });
        const remainingBubbles = newBubbles.filter(bubble => !affectedBubbles.includes(bubble));
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));
        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(level),
          score: gameState.score + affectedBubbles.length * 20,
          particles: [...newParticles, ...createExplosionParticles(shootingBubble.position, '#FFFFFF', 28)],
          comboTexts: newComboTexts,
          soundEvent: 'nova' as const
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

        const bossDefeated = matchedBubbles.some(bubble => bubble.isBoss);
        soundEvent = bossDefeated ? 'boss-defeated' : newCombo >= 2 ? `combo-${newCombo}` : 'pop';

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
        const levelComplete = levelDef.boss
          ? bossDefeated
          : finalBubbles.length === 0 || score >= levelDef.targetScore;
        const comboReward: PowerUpType = newCombo === 3 ? 'bomb' : newCombo === 5 ? 'rainbow' : newCombo >= 7 && newCombo % 3 === 1 ? 'nova' : null;

        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: comboReward ? { ...createRandomBubble(level), powerUp: comboReward } : createRandomBubble(level),
          score,
          particles: newParticles,
          comboTexts: newComboTexts,
          combo: newCombo,
          soundEvent,
          levelComplete,
          bossDefeated: bossDefeated || gameState.bossDefeated
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

// Stores wall bounce positions for particle effects
export let wallBouncePositions: Position[] = [];

const simulateTrajectory = (start: Position, angle: number, speed: number, obstacles: Bubble[]): { trajectory: Position[], hitBubble: Bubble | null, hitTop: boolean } => {
  const config = getGameConfig();
  const trajectory: Position[] = [];
  let pos = { ...start };
  const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
  let hitBubble: Bubble | null = null;
  let hitTop = false;
  wallBouncePositions = [];

  for (let i = 0; i < 150; i++) {
    pos.x += velocity.x;
    pos.y += velocity.y;

    if (pos.x <= config.bubbleRadius || pos.x >= config.canvasWidth - config.bubbleRadius) {
      velocity.x *= -1;
      pos.x = Math.max(config.bubbleRadius, Math.min(config.canvasWidth - config.bubbleRadius, pos.x));
      wallBouncePositions.push({ ...pos });
    }

    const collision = obstacles.find(bubble => {
      const dx = pos.x - bubble.position.x;
      const dy = pos.y - bubble.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= config.bubbleRadius * 1.9;
    });

    if (collision) { hitBubble = collision; break; }
    if (pos.y <= config.bubbleRadius + 30) { hitTop = true; break; }
    trajectory.push({ ...pos });
  }

  return { trajectory, hitBubble, hitTop };
};

const findAttachPosition = (position: Position, bubbles: Bubble[], hitBubble: Bubble | null): { position: Position; row: number; col: number } | null => {
  const config = getGameConfig();
  const { bubbleRadius, canvasWidth } = config;

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
      const colsInRow = config.maxCols - (newRow % 2);
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
      const colsInRow = config.maxCols - (bestPos.row % 2);
      const startX = (canvasWidth - (colsInRow * bubbleRadius * 2)) / 2 + bubbleRadius;
      const finalX = startX + bestPos.col * bubbleRadius * 2 + (bestPos.row % 2) * bubbleRadius;
      const finalY = 50 + bestPos.row * bubbleRadius * 1.8;
      return { position: { x: finalX, y: finalY }, row: bestPos.row, col: bestPos.col };
    }
  }

  // Fallback: top row
  const row = 0;
  const colsInRow = config.maxCols - (row % 2);
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
  const offsets = row % 2 === 0
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

  return offsets
    .map(([dr, dc]) => bubbles.find(b => b.row === row + dr && b.col === col + dc))
    .filter((b): b is Bubble => b !== undefined);
};

const findConnectedBubbles = (bubbles: Bubble[]): Set<string> => {
  const connected = new Set<string>();
  const topBubbles = bubbles.filter(b => b.row === 0);

  const bfs = (start: Bubble) => {
    const queue = [start];
    connected.add(start.id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighbors(current, bubbles);
      neighbors.forEach(n => {
        if (!connected.has(n.id)) {
          connected.add(n.id);
          queue.push(n);
        }
      });
    }
  };

  topBubbles.forEach(b => {
    if (!connected.has(b.id)) bfs(b);
  });

  // Boss cores are objectives, not floating debris. Keep them available until
  // the player clears them with a matching shot.
  bubbles.filter(b => b.isBoss).forEach(b => connected.add(b.id));

  return connected;
};

export const checkGameOver = (gameState: GameState): boolean => {
  const config = getGameConfig();
  const maxY = config.canvasHeight - 80;
  return gameState.bubbles.some(b => b.position.y >= maxY) || gameState.lives <= 0;
};
