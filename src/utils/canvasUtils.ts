
import { GameState, GameConfig, Bubble, Particle, ComboText } from '../types/gameTypes';
import { wallBouncePositions, getThemeBackground } from './gameLogic';

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
  ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
  drawBackground(ctx, config);
  
  if (gameState.particles) {
    gameState.particles.forEach(particle => drawParticle(ctx, particle));
  }
  
  if (gameState.bubbles) {
    gameState.bubbles.forEach(bubble => drawBubble(ctx, bubble, gameState.isFrozen ?? false));
  }
  
  if (gameState.currentBubble) {
    drawShooterTrail(ctx, gameState.currentBubble);
    drawBubble(ctx, gameState.currentBubble, false);
    if (!gameState.isGameOver && !gameState.isPaused) {
      drawAimLine(ctx, gameState.currentBubble.position, aimAngle, config);
    }
  }
  
  if (gameState.nextBubble) {
    const previewX = config.canvasWidth - 40;
    const previewY = config.canvasHeight - 40;
    const previewBubble = {
      ...gameState.nextBubble,
      position: { x: previewX, y: previewY },
      radius: config.bubbleRadius * 0.6
    };
    drawBubble(ctx, previewBubble, false);
    ctx.save();
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', previewX, previewY - 25);
    ctx.restore();
  }
  
  if (gameState.comboTexts) {
    gameState.comboTexts.forEach(comboText => drawComboText(ctx, comboText));
  }
  
  if (gameState.isFrozen) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    ctx.save();
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`❄️ ${Math.ceil(gameState.frozenTimer / 60)}`, config.canvasWidth / 2, 30);
    ctx.restore();
  }
  
  if (wallBouncePositions && wallBouncePositions.length > 0) {
    wallBouncePositions.forEach(pos => drawWallBounceSparks(ctx, pos));
  }
  
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
  const bg = getThemeBackground();
  const gradient = ctx.createLinearGradient(0, 0, 0, config.canvasHeight);
  gradient.addColorStop(0, bg.top);
  gradient.addColorStop(0.5, bg.mid);
  gradient.addColorStop(1, bg.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  
  ctx.strokeStyle = bg.grid;
  ctx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < config.canvasWidth; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, config.canvasHeight); ctx.stroke();
  }
  for (let y = 0; y < config.canvasHeight; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(config.canvasWidth, y); ctx.stroke();
  }
  
  const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
  cornerGlow.addColorStop(0, bg.glow1);
  cornerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = cornerGlow;
  ctx.fillRect(0, 0, 150, 150);
  
  const cornerGlow2 = ctx.createRadialGradient(config.canvasWidth, config.canvasHeight, 0, config.canvasWidth, config.canvasHeight, 150);
  cornerGlow2.addColorStop(0, bg.glow2);
  cornerGlow2.addColorStop(1, 'transparent');
  ctx.fillStyle = cornerGlow2;
  ctx.fillRect(config.canvasWidth - 150, config.canvasHeight - 150, 150, 150);
};

const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble, isFrozen: boolean) => {
  const { x, y } = bubble.position;
  const radius = bubble.radius;
  
  ctx.save();
  
  if (bubble.powerUp === 'bomb') {
    const pulseIntensity = 20 + Math.sin(Date.now() * 0.01) * 10;
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = pulseIntensity;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const bombGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
    bombGradient.addColorStop(0, '#FF6600');
    bombGradient.addColorStop(0.7, '#CC3300');
    bombGradient.addColorStop(1, '#991100');
    ctx.fillStyle = bombGradient;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', x, y);
  } else if (bubble.powerUp === 'rainbow') {
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
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈', x, y);
  } else if (bubble.powerUp === 'freeze') {
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
    ctx.fillStyle = '#0066CC';
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄️', x, y);
  } else {
    ctx.shadowColor = bubble.color;
    ctx.shadowBlur = isFrozen ? 5 : 15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const bubbleGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    bubbleGradient.addColorStop(0, lightenColor(bubble.color, 50));
    bubbleGradient.addColorStop(0.7, bubble.color);
    bubbleGradient.addColorStop(1, darkenColor(bubble.color, 30));
    ctx.fillStyle = bubbleGradient;
    ctx.fill();
  }
  
  const highlightGradient = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, 0, x, y, radius);
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = highlightGradient;
  ctx.fill();
  
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
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10;
  
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

const trailPositions: { x: number; y: number; alpha: number; radius: number; color: string }[] = [];
let trailFrame = 0;

const drawShooterTrail = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
  trailFrame++;
  const { x, y } = bubble.position;
  const color = bubble.color;

  if (trailFrame % 2 === 0) {
    trailPositions.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      alpha: 0.7,
      radius: 3 + Math.random() * 3,
      color
    });
  }

  for (let i = trailPositions.length - 1; i >= 0; i--) {
    const t = trailPositions[i];
    t.alpha -= 0.025;
    t.radius *= 0.97;
    t.y += 0.3;
    if (t.alpha <= 0) { trailPositions.splice(i, 1); continue; }
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

  while (trailPositions.length > 30) trailPositions.shift();

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

const drawWallBounceSparks = (ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) => {
  const time = Date.now();
  const sparkCount = 6;
  const isLeftWall = pos.x < 50;
  ctx.save();
  for (let i = 0; i < sparkCount; i++) {
    const angle = isLeftWall
      ? -Math.PI / 4 + (Math.PI / 2) * (i / sparkCount)
      : Math.PI / 2 + Math.PI / 4 + (Math.PI / 2) * (i / sparkCount);
    const dist = 8 + Math.sin(time * 0.01 + i) * 5;
    const sx = pos.x + Math.cos(angle) * dist;
    const sy = pos.y + Math.sin(angle) * dist;
    const alpha = 0.5 + Math.sin(time * 0.015 + i * 0.5) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#FFFF00' : '#FF8800';
    ctx.fill();
  }
  ctx.restore();
};

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
