
import { GameState, GameConfig } from '../types/gameTypes';

const GAME_CONFIG: GameConfig = {
  canvasWidth: 350,
  canvasHeight: 500,
  bubbleRadius: 18,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
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
  
  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, config.canvasHeight);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  
  // Draw bubbles
  gameState.bubbles.forEach(bubble => {
    drawBubble(ctx, bubble);
  });
  
  // Draw current and next bubbles
  if (gameState.currentBubble) {
    drawBubble(ctx, gameState.currentBubble);
    
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
    drawBubble(ctx, previewBubble);
    
    // Draw "NEXT" label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', previewX, previewY - 25);
  }
  
  // Draw pause overlay
  if (gameState.isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', config.canvasWidth / 2, config.canvasHeight / 2);
  }
};

const drawBubble = (ctx: CanvasRenderingContext2D, bubble: any) => {
  const { x, y } = bubble.position;
  const radius = bubble.radius;
  
  // Draw bubble shadow
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();
  
  // Draw main bubble
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = bubble.color;
  ctx.fill();
  
  // Draw bubble highlight
  const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw bubble border
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawAimLine = (
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  angle: number,
  config: GameConfig
) => {
  const lineLength = 100;
  const endX = position.x + Math.cos(angle) * lineLength;
  const endY = position.y + Math.sin(angle) * lineLength;
  
  // Draw dashed aim line
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(position.x, position.y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw arrow at the end
  const arrowSize = 8;
  const arrowAngle = Math.PI / 6;
  
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - arrowSize * Math.cos(angle - arrowAngle),
    endY - arrowSize * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - arrowSize * Math.cos(angle + arrowAngle),
    endY - arrowSize * Math.sin(angle + arrowAngle)
  );
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
};
