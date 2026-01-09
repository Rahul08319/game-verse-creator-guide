
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

const POWER_UP_CHANCE = 0.08; // 8% chance for power-up

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
    isPaused: false,
    isFrozen: false,
    frozenTimer: 0,
    particles: [],
    comboTexts: [],
    combo: 0
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
        col,
        powerUp: null
      });
    }
  }
  
  return bubbles;
};

const createRandomBubble = (): Bubble => {
  const { colors, bubbleRadius, canvasWidth } = GAME_CONFIG;
  
  // Determine if this should be a power-up bubble
  let powerUp: PowerUpType = null;
  if (Math.random() < POWER_UP_CHANCE) {
    const powerUps: PowerUpType[] = ['bomb', 'rainbow', 'freeze'];
    powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
  }
  
  return {
    id: `bubble-${Date.now()}-${Math.random()}`,
    position: { x: canvasWidth / 2, y: GAME_CONFIG.canvasHeight - 30 },
    color: colors[Math.floor(Math.random() * colors.length)],
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
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
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
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 2 // Upward bias
      },
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
    .map(particle => ({
      ...particle,
      position: {
        x: particle.position.x + particle.velocity.x,
        y: particle.position.y + particle.velocity.y
      },
      velocity: {
        x: particle.velocity.x * 0.95,
        y: particle.velocity.y * 0.95 + 0.1 // Gravity
      },
      life: particle.life - 1
    }))
    .filter(particle => particle.life > 0);
};

export const updateComboTexts = (comboTexts: ComboText[]): ComboText[] => {
  return comboTexts
    .map(text => ({
      ...text,
      position: { ...text.position, y: text.position.y - 1 },
      life: text.life - 1,
      scale: text.scale + 0.02
    }))
    .filter(text => text.life > 0);
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
      
      // Handle power-ups
      if (shootingBubble.powerUp === 'bomb') {
        // Bomb: clear bubbles in radius
        const bombRadius = GAME_CONFIG.bubbleRadius * 4;
        const affectedBubbles = newBubbles.filter(bubble => {
          const dx = bubble.position.x - shootingBubble.position.x;
          const dy = bubble.position.y - shootingBubble.position.y;
          return Math.sqrt(dx * dx + dy * dy) <= bombRadius;
        });
        
        // Create explosion particles for each affected bubble
        affectedBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color, 8)];
        });
        
        // Big center explosion
        newParticles = [...newParticles, ...createExplosionParticles(shootingBubble.position, '#FF6600', 20)];
        
        const remainingBubbles = newBubbles.filter(bubble => !affectedBubbles.includes(bubble));
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));
        
        const score = gameState.score + affectedBubbles.length * 15 + (remainingBubbles.length - finalBubbles.length) * 10;
        
        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(),
          score,
          particles: newParticles,
          comboTexts: newComboTexts
        };
        
      } else if (shootingBubble.powerUp === 'freeze') {
        // Freeze: stop time for 3 seconds (180 frames at 60fps)
        isFrozen = true;
        frozenTimer = 180;
        
        newParticles = [...newParticles, ...createExplosionParticles(shootingBubble.position, '#00FFFF', 15)];
        
        return {
          ...gameState,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(),
          isFrozen,
          frozenTimer,
          particles: newParticles,
          comboTexts: newComboTexts
        };
        
      } else if (shootingBubble.powerUp === 'rainbow') {
        // Rainbow: matches any color - find the most common color nearby
        const neighbors = getNeighbors(shootingBubble, newBubbles);
        if (neighbors.length > 0) {
          const colorCounts: Record<string, number> = {};
          neighbors.forEach(n => {
            colorCounts[n.color] = (colorCounts[n.color] || 0) + 1;
          });
          const bestColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (bestColor) {
            shootingBubble.color = bestColor;
          }
        }
        shootingBubble.powerUp = null;
      }
      
      newBubbles.push(shootingBubble);
      
      // Check for matches
      const matchedBubbles = findMatches(shootingBubble, newBubbles);
      let score = gameState.score;
      
      if (matchedBubbles.length >= 3) {
        // Create explosion particles for each matched bubble
        matchedBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color)];
        });
        
        // Remove matched bubbles
        const remainingBubbles = newBubbles.filter(bubble => 
          !matchedBubbles.some(matched => matched.id === bubble.id)
        );
        
        // Remove floating bubbles
        const connectedBubbles = findConnectedBubbles(remainingBubbles);
        const floatingBubbles = remainingBubbles.filter(bubble => !connectedBubbles.has(bubble.id));
        
        // Create particles for falling bubbles
        floatingBubbles.forEach(bubble => {
          newParticles = [...newParticles, ...createExplosionParticles(bubble.position, bubble.color, 6)];
        });
        
        const finalBubbles = remainingBubbles.filter(bubble => connectedBubbles.has(bubble.id));
        
        // Calculate score with combo multiplier
        newCombo = gameState.combo + 1;
        const comboMultiplier = 1 + (newCombo - 1) * 0.5;
        const baseScore = matchedBubbles.length * 10 + floatingBubbles.length * 5;
        score += Math.floor(baseScore * comboMultiplier);
        
        // Add combo text and particles
        if (newCombo >= 2) {
          const centerPos = {
            x: matchedBubbles.reduce((sum, b) => sum + b.position.x, 0) / matchedBubbles.length,
            y: matchedBubbles.reduce((sum, b) => sum + b.position.y, 0) / matchedBubbles.length
          };
          newComboTexts = [...newComboTexts, createComboText(centerPos, newCombo)];
          newParticles = [...newParticles, ...createComboParticles(centerPos, '#FFFF00')];
        }
        
        return {
          ...gameState,
          bubbles: finalBubbles,
          currentBubble: gameState.nextBubble,
          nextBubble: createRandomBubble(),
          score,
          particles: newParticles,
          comboTexts: newComboTexts,
          combo: newCombo
        };
      }
    }
  }
  
  return {
    ...gameState,
    bubbles: newBubbles,
    currentBubble: gameState.nextBubble,
    nextBubble: createRandomBubble(),
    particles: newParticles,
    comboTexts: newComboTexts,
    combo: 0 // Reset combo on miss
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
