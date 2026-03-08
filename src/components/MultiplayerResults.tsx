import React from 'react';
import { MultiplayerPlayer, getPlayerId } from '../utils/multiplayer';

interface Props {
  players: MultiplayerPlayer[];
  onClose: () => void;
  onRematch: () => void;
  rematchLoading?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const MultiplayerResults: React.FC<Props> = ({ players, onClose }) => {
  const myId = getPlayerId();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const myRank = sorted.findIndex(p => p.player_id === myId) + 1;
  const isWinner = winner?.player_id === myId;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-6 w-80 border border-purple-500/30 shadow-2xl text-center">
        {/* Trophy header */}
        <div className="text-5xl mb-2 animate-bounce">🏆</div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 mb-1">
          Match Over!
        </h2>
        <p className="text-sm text-yellow-300 font-semibold mb-4">
          {isWinner ? '🎉 You won!' : `👑 ${winner?.player_name} wins!`}
        </p>

        {/* Rankings */}
        <div className="space-y-2 mb-4">
          {sorted.map((p, i) => {
            const isMe = p.player_id === myId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                  i === 0
                    ? 'bg-yellow-500/15 border border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                    : isMe
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-white/5 border border-white/5'
                }`}
              >
                <span className="text-lg w-6 text-center">
                  {i < 3 ? MEDALS[i] : <span className="text-gray-500 text-xs font-bold">{i + 1}</span>}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <span className={`font-semibold truncate block ${isMe ? 'text-green-300' : 'text-white'}`}>
                    {p.player_name}{isMe ? ' (You)' : ''}
                  </span>
                  <span className="text-[10px] text-gray-500">Level {p.level}</span>
                </div>
                <span className={`font-bold tabular-nums ${i === 0 ? 'text-yellow-400 text-base' : 'text-cyan-400'}`}>
                  {p.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Your stats summary */}
        {myRank > 0 && (
          <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Your Stats</p>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-white font-bold text-lg">{myRank}{myRank === 1 ? 'st' : myRank === 2 ? 'nd' : myRank === 3 ? 'rd' : 'th'}</p>
                <p className="text-[10px] text-gray-500">Rank</p>
              </div>
              <div>
                <p className="text-cyan-400 font-bold text-lg">{sorted[myRank - 1]?.score.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Score</p>
              </div>
              <div>
                <p className="text-purple-400 font-bold text-lg">{sorted[myRank - 1]?.level}</p>
                <p className="text-[10px] text-gray-500">Level</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default MultiplayerResults;
