import React from 'react';
import { MultiplayerPlayer, getPlayerId } from '../utils/multiplayer';

interface Props {
  players: MultiplayerPlayer[];
}

const MultiplayerScoreboard: React.FC<Props> = ({ players }) => {
  const myId = getPlayerId();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-sm rounded-xl border border-green-500/20 p-2 w-36">
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
