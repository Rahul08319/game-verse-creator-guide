import React from 'react';
import { MultiplayerPlayer, getPlayerId } from '../utils/multiplayer';

interface Props {
  players: MultiplayerPlayer[];
  timeLeft?: number | null;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const MultiplayerScoreboard: React.FC<Props> = ({ players, timeLeft }) => {
  const myId = getPlayerId();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const isLowTime = timeLeft !== null && timeLeft !== undefined && timeLeft <= 15;

  return (
    <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-sm rounded-xl border border-green-500/20 p-2 w-36">
      {timeLeft !== null && timeLeft !== undefined && (
        <div className={`text-center mb-1.5 py-1 rounded-lg font-mono font-bold text-sm ${
          isLowTime ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'bg-white/5 text-white'
        }`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      )}
      <p className="text-[9px] text-green-400 font-bold mb-1 text-center">🎮 LIVE SCORES</p>
      <div className="space-y-1">
        {sorted.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
            p.player_id === myId ? 'bg-green-500/15 border border-green-500/20' : 'bg-white/5'
          } ${p.is_game_over ? 'opacity-50' : ''}`}>
            <span className="font-bold w-3 text-center text-gray-500">{i + 1}</span>
            <span className="flex-1 truncate text-white">{p.player_name}{p.player_id === myId ? ' (You)' : ''}</span>
            <span className="text-cyan-400 font-bold">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiplayerScoreboard;
