
import { GameState, GameConfig, Bubble, Particle, ComboText } from '../types/gameTypes';

const GAME_CONFIG: GameConfig = {
  canvasWidth: 350,
  canvasHeight: 500,
  bubbleRadius: 18,
  colors: ['#FF0080', '#00FFFF', '#00FF41', '#FFFF00', '#FF00FF', '#FF6600', '#0080FF'],
  neonColors: ['#FF0080', '#00FFFF', '#00FF41', '#FFFF00', '#FF00FF', '#FF6600', '#0080FF'],
  rowCount: 8,
  maxCols: 10
};

export const getCanvasConfig = (): GameConfig => GAME_CONFIG;

export const drawGame = (
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  aimAngle: number,
  config: GameConfig
) => {
  // Clear canvas
  ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
  
  // Draw dark background with subtle grid
  drawBackground(ctx, config);
  
  // Draw particles (behind bubbles)
  if (gameState.particles) {
    gameState.particles.forEach(particle => {
      drawParticle(ctx, particle);
    });
  }
  
  // Draw bubbles
  if (gameState.bubbles) {
    gameState.bubbles.forEach(bubble => {
      drawBubble(ctx, bubble, gameState.isFrozen ?? false);
    });
  }
  
  // Draw current bubble
  if (gameState.currentBubble) {
    // Draw trail particles behind the current bubble
    drawShooterTrail(ctx, gameState.currentBubble);
    drawBubble(ctx, gameState.currentBubble, false);
    
    // Draw aim line
    if (!gameState.isGameOver && !gameState.isPaused) {
      drawAimLine(ctx, gameState.currentBubble.position, aimAngle, config);
    }
  }
  
  // Draw next bubble preview
  if (gameState.nextBubble) {
    const previewX = config.canvasWidth - 40;
    const previewY = config.canvasHeight - 40;
    const previewBubble = {
      ...gameState.nextBubble,
      position: { x: previewX, y: previewY },
      radius: config.bubbleRadius * 0.6
    };
    drawBubble(ctx, previewBubble, false);
    
    // Draw "NEXT" label with neon effect
    ctx.save();
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', previewX, previewY - 25);
    ctx.restore();
  }
  
  // Draw combo texts
  if (gameState.comboTexts) {
    gameState.comboTexts.forEach(comboText => {
      drawComboText(ctx, comboText);
    });
  }
  
  // Draw freeze overlay
  if (gameState.isFrozen) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // Draw freeze timer
    ctx.save();
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`❄️ ${Math.ceil(gameState.frozenTimer / 60)}`, config.canvasWidth / 2, 30);
    ctx.restore();
  }
  
  // Draw pause overlay
  if (gameState.isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    ctx.save();
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FF00FF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', config.canvasWidth / 2, config.canvasHeight / 2);
    ctx.restore();
  }
};

const drawBackground = (ctx: CanvasRenderingContext2D, config: GameConfig) => {
  // Dark gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, config.canvasHeight);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#1a0a2e');
  gradient.addColorStop(1, '#0a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  
  // Draw subtle hexagonal grid pattern
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < config.canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, config.canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < config.canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(config.canvasWidth, y);
    ctx.stroke();
  }
  
  // Add corner glow effects
  const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
  cornerGlow.addColorStop(0, 'rgba(255, 0, 128, 0.15)');
  cornerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = cornerGlow;
  ctx.fillRect(0, 0, 150, 150);
  
  const cornerGlow2 = ctx.createRadialGradient(config.canvasWidth, config.canvasHeight, 0, config.canvasWidth, config.canvasHeight, 150);
  cornerGlow2.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
  cornerGlow2.addColorStop(1, 'transparent');
  ctx.fillStyle = cornerGlow2;
  ctx.fillRect(config.canvasWidth - 150, config.canvasHeight - 150, 150, 150);
};

const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble, isFrozen: boolean) => {
  const { x, y } = bubble.position;
  const radius = bubble.radius;
  
  ctx.save();
  
  // Special effects for power-ups
  if (bubble.powerUp === 'bomb') {
    // Bomb bubble - pulsing red/orange glow
    const pulseIntensity = 20 + Math.sin(Date.now() * 0.01) * 10;
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = pulseIntensity;
    
    // Draw bomb icon
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const bombGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
    bombGradient.addColorStop(0, '#FF6600');
    bombGradient.addColorStop(0.7, '#CC3300');
    bombGradient.addColorStop(1, '#991100');
    ctx.fillStyle = bombGradient;
    ctx.fill();
    
    // Bomb symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', x, y);
    
  } else if (bubble.powerUp === 'rainbow') {
    // Rainbow bubble - rotating gradient
    const time = Date.now() * 0.002;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 25;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const rainbowGradient = ctx.createConicGradient(time, x, y);
    rainbowGradient.addColorStop(0, '#FF0080');
    rainbowGradient.addColorStop(0.17, '#FF6600');
    rainbowGradient.addColorStop(0.33, '#FFFF00');
    rainbowGradient.addColorStop(0.5, '#00FF41');
    rainbowGradient.addColorStop(0.67, '#00FFFF');
    rainbowGradient.addColorStop(0.83, '#FF00FF');
    rainbowGradient.addColorStop(1, '#FF0080');
    ctx.fillStyle = rainbowGradient;
    ctx.fill();
    
    // Rainbow symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈', x, y);
    
  } else if (bubble.powerUp === 'freeze') {
    // Freeze bubble - icy blue glow
    const pulseIntensity = 15 + Math.sin(Date.now() * 0.008) * 8;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = pulseIntensity;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const freezeGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
    freezeGradient.addColorStop(0, '#FFFFFF');
    freezeGradient.addColorStop(0.5, '#80FFFF');
    freezeGradient.addColorStop(1, '#00CCFF');
    ctx.fillStyle = freezeGradient;
    ctx.fill();
    
    // Freeze symbol
    ctx.fillStyle = '#0066CC';
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄️', x, y);
    
  } else {
    // Regular bubble with neon glow
    ctx.shadowColor = bubble.color;
    ctx.shadowBlur = isFrozen ? 5 : 15;
    
    // Draw main bubble
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    const bubbleGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    bubbleGradient.addColorStop(0, lightenColor(bubble.color, 50));
    bubbleGradient.addColorStop(0.7, bubble.color);
    bubbleGradient.addColorStop(1, darkenColor(bubble.color, 30));
    ctx.fillStyle = bubbleGradient;
    ctx.fill();
  }
  
  // Bubble highlight (glass effect)
  const highlightGradient = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, 0, x, y, radius);
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = highlightGradient;
  ctx.fill();
  
  // Neon border
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = bubble.powerUp ? '#FFFFFF' : bubble.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  const alpha = particle.life / particle.maxLife;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  if (particle.type === 'explosion') {
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  } else if (particle.type === 'trail') {
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  } else if (particle.type === 'combo') {
    // Star-shaped particles for combos
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 15;
    drawStar(ctx, particle.position.x, particle.position.y, 5, particle.radius * alpha, particle.radius * 0.5 * alpha);
    ctx.fillStyle = particle.color;
    ctx.fill();
  }
  
  ctx.restore();
};

const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
};

const drawComboText = (ctx: CanvasRenderingContext2D, comboText: ComboText) => {
  const alpha = comboText.life / 60;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#FFFF00';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFFF00';
  ctx.font = `bold ${24 * comboText.scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(comboText.text, comboText.position.x, comboText.position.y);
  ctx.restore();
};

const drawAimLine = (
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  angle: number,
  config: GameConfig
) => {
  const lineLength = 120;
  const endX = position.x + Math.cos(angle) * lineLength;
  const endY = position.y + Math.sin(angle) * lineLength;
  
  ctx.save();
  
  // Neon aim line with glow
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10;
  
  // Draw dotted line
  const dotCount = 15;
  for (let i = 0; i < dotCount; i++) {
    const t = i / dotCount;
    const x = position.x + (endX - position.x) * t;
    const y = position.y + (endY - position.y) * t;
    const radius = 3 - t * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${1 - t * 0.5})`;
    ctx.fill();
  }
  
  // Draw crosshair at end
  ctx.beginPath();
  ctx.arc(endX, endY, 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(endX - 10, endY);
  ctx.lineTo(endX + 10, endY);
  ctx.moveTo(endX, endY - 10);
  ctx.lineTo(endX, endY + 10);
  ctx.stroke();
  
  ctx.restore();
};

// Animated trail behind shooter bubble
const trailPositions: { x: number; y: number; alpha: number; radius: number; color: string }[] = [];
let trailFrame = 0;

const drawShooterTrail = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
  trailFrame++;
  const { x, y } = bubble.position;
  const color = bubble.color;

  // Add new trail dot every 2 frames
  if (trailFrame % 2 === 0) {
    trailPositions.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      alpha: 0.7,
      radius: 3 + Math.random() * 3,
      color
    });
  }

  // Update and draw trail
  for (let i = trailPositions.length - 1; i >= 0; i--) {
    const t = trailPositions[i];
    t.alpha -= 0.025;
    t.radius *= 0.97;
    t.y += 0.3;

    if (t.alpha <= 0) {
      trailPositions.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.restore();
  }

  // Keep trail array bounded
  while (trailPositions.length > 30) trailPositions.shift();

  // Glow ring around current bubble
  ctx.save();
  const pulseSize = 2 + Math.sin(Date.now() * 0.006) * 2;
  ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.006) * 0.15;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, bubble.radius + pulseSize, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
};

// Helper functions for color manipulation
const lightenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const darkenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
};
