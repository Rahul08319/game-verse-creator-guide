
import React from 'react';
import { hasPlayedToday, getDailyLeaderboard, getTodayBestScore, DailyScore } from '../utils/dailyChallenge';

interface DailyChallengeOverlayProps {
  onStart: () => void;
  onClose: () => void;
}

const DailyChallengeOverlay: React.FC<DailyChallengeOverlayProps> = ({ onStart, onClose }) => {
  const played = hasPlayedToday();
  const bestScore = getTodayBestScore();
  const leaderboard = getDailyLeaderboard();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-[90%] max-w-xs max-h-[90%] overflow-auto border border-yellow-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
            📅 Daily Challenge
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        <p className="text-gray-400 text-xs mb-3">{today}</p>
        <p className="text-gray-300 text-sm mb-4">
          Same puzzle for everyone today! Fixed seed means identical bubble sequence. 
          How high can you score?
        </p>

        {played && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-yellow-400 text-sm font-bold">Your Best Today</p>
            <p className="text-2xl font-bold text-white">{bestScore.toLocaleString()}</p>
          </div>
        )}

        {/* Mini leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-orange-300 mb-2 uppercase tracking-wider">Today's Top Scores</h3>
            <div className="space-y-1.5 max-h-32 overflow-auto">
              {leaderboard.slice(0, 5).map((s, i) => (
                <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${i === 0 ? 'bg-yellow-500/10' : 'bg-white/5'}`}>
                  <span className={`font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}</span>
                  <span className="text-white flex-1 truncate">{s.name}</span>
                  <span className="text-cyan-400 font-bold">{s.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-full font-bold text-sm hover:scale-105 transform transition-all duration-200 shadow-lg shadow-orange-500/25"
        >
          {played ? 'Play Again 🔄' : 'Start Challenge 🚀'}
        </button>
      </div>
    </div>
  );
};

export default DailyChallengeOverlay;
