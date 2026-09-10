import type { WeeklyGhostRun } from '../utils/weeklyGhost';

interface WeeklyGhostPaceProps { ghost: WeeklyGhostRun; elapsedMs: number; score: number; }

const WeeklyGhostPace = ({ ghost, elapsedMs, score }: WeeklyGhostPaceProps) => {
  const expectedScore = ghost.durationMs > 0 ? Math.round(ghost.score * Math.min(1, elapsedMs / ghost.durationMs)) : ghost.score;
  const ahead = score >= expectedScore;
  return (
    <div className="absolute top-2 left-2 rounded-xl border border-white/15 bg-[#081427]/85 backdrop-blur px-2.5 py-1.5 text-[10px] shadow-lg pointer-events-none">
      <div className="font-bold text-cyan-200">👻 Personal ghost</div>
      <div className={ahead ? 'text-emerald-300' : 'text-amber-200'}>{ahead ? '▲ Ahead' : '▼ Chasing'} · {expectedScore.toLocaleString()} pts</div>
    </div>
  );
};

export default WeeklyGhostPace;
