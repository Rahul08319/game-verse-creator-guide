
import { useState, useEffect } from 'react';
import { getHighScores, HighScore } from '../utils/highScores';

interface StatsOverlayProps {
  onClose: () => void;
}

const StatsOverlay = ({ onClose }: StatsOverlayProps) => {
  const [scores, setScores] = useState<HighScore[]>([]);

  useEffect(() => {
    setScores(getHighScores());
  }, []);

  const totalGames = scores.length;
  const avgScore = totalGames > 0 ? Math.round(scores.reduce((s, h) => s + h.score, 0) / totalGames) : 0;
  const bestScore = totalGames > 0 ? Math.max(...scores.map(s => s.score)) : 0;
  const bestLevel = totalGames > 0 ? Math.max(...scores.map(s => s.level)) : 0;
  const avgLevel = totalGames > 0 ? (scores.reduce((s, h) => s + h.level, 0) / totalGames).toFixed(1) : '0';

  // Calculate best streak (consecutive games with increasing scores)
  let bestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i].score >= scores[i - 1].score) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);
  if (totalGames === 0) bestStreak = 0;

  // Recent 5 scores for mini chart
  const recent = scores.slice(0, 8);
  const maxRecent = recent.length > 0 ? Math.max(...recent.map(s => s.score), 1) : 1;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-72 max-h-[85%] overflow-auto border border-cyan-500/30 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">📊 Your Stats</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        {totalGames === 0 ? (
          <p className="text-gray-500 text-center text-sm py-8">No games played yet. Start playing!</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Best Score', value: bestScore.toLocaleString(), icon: '🏆', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/20' },
                { label: 'Avg Score', value: avgScore.toLocaleString(), icon: '📈', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20' },
                { label: 'Best Level', value: bestLevel, icon: '⭐', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/20' },
                { label: 'Avg Level', value: avgLevel, icon: '📊', color: 'from-green-500/20 to-emerald-500/20 border-green-500/20' },
                { label: 'Games Played', value: totalGames, icon: '🎮', color: 'from-pink-500/20 to-red-500/20 border-pink-500/20' },
                { label: 'Best Streak', value: bestStreak, icon: '🔥', color: 'from-orange-500/20 to-red-500/20 border-orange-500/20' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-xl p-2.5 text-center`}>
                  <div className="text-lg">{stat.icon}</div>
                  <div className="text-white font-bold text-sm">{stat.value}</div>
                  <div className="text-gray-400 text-[10px]">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mini bar chart of recent scores */}
            <div className="mb-3">
              <h3 className="text-xs text-gray-400 mb-2 font-semibold">Recent Scores</h3>
              <div className="flex items-end gap-1 h-16">
                {recent.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-sm transition-all"
                      style={{ height: `${(s.score / maxRecent) * 100}%`, minHeight: 2 }}
                    />
                    <span className="text-[7px] text-gray-500">{s.score > 999 ? `${(s.score / 1000).toFixed(1)}k` : s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsOverlay;
