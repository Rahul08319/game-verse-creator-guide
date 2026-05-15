interface StreakBadgeProps {
  streak: number;
  pendingPowerUp?: 'bomb' | 'freeze' | 'rainbow' | null;
}

const powerUpIcon = { bomb: '💣', freeze: '❄️', rainbow: '🌈' } as const;

const StreakBadge = ({ streak, pendingPowerUp }: StreakBadgeProps) => {
  if (streak <= 0) return null;
  const hot = streak >= 3;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold animate-fade-in
        ${hot
          ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 border-orange-400/50 text-orange-200 shadow-lg shadow-orange-500/20'
          : 'bg-white/10 border-white/20 text-white/80'}`}
      title={`${streak}-day streak${pendingPowerUp ? ` · Power-up ready: ${pendingPowerUp}` : ''}`}
    >
      <span className={hot ? 'animate-pulse' : ''}>🔥</span>
      <span>{streak}-day streak</span>
      {pendingPowerUp && (
        <span className="ml-1 px-1 rounded bg-black/30 border border-white/20">
          {powerUpIcon[pendingPowerUp]}
        </span>
      )}
    </div>
  );
};

export default StreakBadge;
