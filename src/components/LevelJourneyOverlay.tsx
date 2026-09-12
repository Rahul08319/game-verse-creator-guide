import { getBossForLevel, getTargetScore } from '../utils/gameLogic';
import { getNextCosmeticGoal } from '../utils/cosmetics';

interface LevelJourneyOverlayProps {
  currentLevel: number;
  onClose: () => void;
}

const LevelJourneyOverlay = ({ currentLevel, onClose }: LevelJourneyOverlayProps) => {
  const nextGoal = getNextCosmeticGoal();
  const levels = Array.from({ length: 10 }, (_, index) => index + 1);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#101b43]/95 via-[#1b1745]/95 to-[#32133b]/95 rounded-2xl p-5 w-[90%] max-w-sm max-h-[88%] overflow-auto border border-indigo-400/30 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <div><h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300">✦ Level Journey</h2><p className="text-[10px] text-gray-400">Your next ten bubble worlds</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg" aria-label="Close level journey">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {levels.map(level => {
            const boss = getBossForLevel(level);
            const current = level === currentLevel;
            const completed = level < currentLevel;
            return (
              <div key={level} className={`rounded-xl border p-2.5 ${current ? 'border-cyan-300/70 bg-cyan-400/15 shadow-lg shadow-cyan-500/10' : completed ? 'border-emerald-400/25 bg-emerald-400/5' : 'border-white/10 bg-white/[0.04]'}`}>
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">{completed ? '✓ ' : ''}Level {level}</span>{boss && <span className="text-amber-300 text-sm" title="Boss puzzle">♛</span>}</div>
                <p className="text-[10px] text-gray-400 mt-1">{boss ? `Defeat ${boss.name}` : `${getTargetScore(level).toLocaleString()} point target`}</p>
                {current && <p className="text-[9px] text-cyan-200 font-bold mt-1">CURRENT RUN</p>}
              </div>
            );
          })}
        </div>

        {nextGoal && <div className="mt-3 rounded-xl border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-[10px] text-purple-100">✨ {nextGoal}</div>}
      </div>
    </div>
  );
};

export default LevelJourneyOverlay;
