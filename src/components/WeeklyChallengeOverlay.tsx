import { getWeekKey, getWeeklyBestScore } from '../utils/weeklyChallenge';
import { getWeeklyGhost } from '../utils/weeklyGhost';

interface WeeklyChallengeOverlayProps {
  onStart: () => void;
  onClose: () => void;
}

const WeeklyChallengeOverlay = ({ onStart, onClose }: WeeklyChallengeOverlayProps) => {
  const best = getWeeklyBestScore();
  const ghost = getWeeklyGhost();
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#102a43]/95 to-[#24133d]/95 rounded-2xl p-5 w-[90%] max-w-xs border border-cyan-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-3"><h2 className="text-xl font-bold text-cyan-300">🗓️ Weekly Challenge</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button></div>
        <p className="text-gray-300 text-sm mb-3">A curated fixed-seed run for the whole week. Every attempt has the same opening board and bubble sequence.</p>
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-4 text-center"><p className="text-cyan-300 text-xs font-bold">WEEK {getWeekKey()}</p><p className="text-2xl font-bold text-white">{best ? best.toLocaleString() : '—'}</p><p className="text-[10px] text-gray-400">Your best score</p></div>
        {ghost && <p className="text-[10px] text-purple-200 text-center -mt-2 mb-3">👻 Ghost pace ready · {ghost.shots.length} recorded shots</p>}
        <button onClick={onStart} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-full font-bold text-sm">{best ? 'Try Again 🔄' : 'Start Weekly Run 🚀'}</button>
      </div>
    </div>
  );
};

export default WeeklyChallengeOverlay;
