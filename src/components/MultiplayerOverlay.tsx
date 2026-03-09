import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  createRoom, joinRoom, startGame, getPlayers, subscribeToPlayers, subscribeToSession,
  MultiplayerSession, MultiplayerPlayer, getPlayerId,
} from '../utils/multiplayer';

interface MultiplayerOverlayProps {
  onStart: (session: MultiplayerSession) => void;
  onClose: () => void;
}

const LOBBY_EMOJIS = ['👋', '🔥', '😂', '👏', '💪', '🎯', '❤️', '🤩'];

interface FloatingEmoji {
  id: string;
  emoji: string;
  playerName: string;
  createdAt: number;
}

const MultiplayerOverlay: React.FC<MultiplayerOverlayProps> = ({ onStart, onClose }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [session, setSession] = useState<MultiplayerSession | null>(null);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lobbyEmojis, setLobbyEmojis] = useState<FloatingEmoji[]>([]);
  const [emojiCooldown, setEmojiCooldown] = useState(false);
  const lobbyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!session) return;
    getPlayers(session.sessionId).then(setPlayers);
    const unsub1 = subscribeToPlayers(session.sessionId, setPlayers);
    const unsub2 = subscribeToSession(session.sessionId, (status) => {
      if (status === 'playing') onStart(session);
    });
    return () => { unsub1(); unsub2(); };
  }, [session, onStart]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const s = await createRoom(name || 'Player');
    if (s) setSession(s);
    else setError('Failed to create room');
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    const s = await joinRoom(roomCode.trim(), name || 'Player');
    if (s) setSession(s);
    else setError('Room not found or already started');
    setLoading(false);
  };

  const handleStart = async () => {
    if (!session) return;
    await startGame(session.sessionId);
    onStart(session);
  };

  const isHost = session && players.length > 0 && players.find(p => p.player_id === getPlayerId())?.player_id === players.sort((a, b) => new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime())[0]?.player_id;

  if (session) {
    return (
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-3xl flex items-center justify-center z-30 animate-fade-in">
        <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-72 border border-green-500/30 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
              🎮 Room: {session.roomCode}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <p className="text-gray-400 text-xs mb-3">Share this code with friends to join!</p>

          <div className="bg-white/5 rounded-xl p-3 mb-3 text-center">
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-green-400">
              {session.roomCode}
            </span>
          </div>

          <div className="space-y-1.5 mb-4">
            <p className="text-gray-400 text-xs font-semibold">Players ({players.length}):</p>
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                <span className="text-sm">{i === 0 ? '👑' : '🎮'}</span>
                <span className="text-white text-sm flex-1 truncate">{p.player_name}</span>
                <span className="text-green-400 text-[10px]">Ready</span>
              </div>
            ))}
          </div>

          {players.length < 2 ? (
            <p className="text-yellow-400/80 text-xs text-center animate-pulse">Waiting for players...</p>
          ) : isHost ? (
            <button onClick={handleStart} className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-white py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
              Start Game ({players.length} players)
            </button>
          ) : (
            <p className="text-cyan-400/80 text-xs text-center animate-pulse">Waiting for host to start...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-72 border border-green-500/30 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
            🎮 Multiplayer
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-transparent'}`}>
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name" maxLength={12}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-400 transition-colors mb-2"
        />

        {tab === 'join' && (
          <input
            value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code (e.g. ABC12)" maxLength={5}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono tracking-widest text-center outline-none focus:border-green-400 transition-colors mb-2"
          />
        )}

        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-white py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? '...' : tab === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>
    </div>
  );
};

export default MultiplayerOverlay;
