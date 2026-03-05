
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GameState } from '../types/gameTypes';
import { drawGame, getCanvasConfig } from '../utils/canvasUtils';

interface GameCanvasProps {
  gameState: GameState;
  aimAngle: number;
  screenShake: { x: number; y: number };
  onShoot: (angle: number) => void;
  onAimChange: (angle: number) => void;
  onAimingChange: (isAiming: boolean) => void;
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(({
  gameState,
  aimAngle,
  screenShake,
  onShoot,
  onAimChange,
  onAimingChange
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useImperativeHandle(ref, () => canvasRef.current!);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = getCanvasConfig();
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    const animate = () => {
      ctx.save();
      ctx.translate(screenShake.x, screenShake.y);
      drawGame(ctx, gameState, aimAngle, config);
      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, aimAngle, screenShake]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.isGameOver || gameState.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const config = getCanvasConfig();
    const shooterX = config.canvasWidth / 2;
    const shooterY = config.canvasHeight - 30;

    const angle = Math.atan2(y - shooterY, x - shooterX);
    
    // Limit angle to prevent shooting backwards
    const clampedAngle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
    onAimChange(clampedAngle);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    onShoot(aimAngle);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    if (gameState.isGameOver || gameState.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas || event.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const config = getCanvasConfig();
    const shooterX = config.canvasWidth / 2;
    const shooterY = config.canvasHeight - 30;

    const angle = Math.atan2(y - shooterY, x - shooterX);
    const clampedAngle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
    onAimChange(clampedAngle);
    onAimingChange(true);
  };

  const handleTouchEnd = () => {
    if (gameState.isGameOver || gameState.isPaused) return;
    onShoot(aimAngle);
    onAimingChange(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-white/20 rounded-2xl shadow-lg cursor-crosshair touch-none"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;
