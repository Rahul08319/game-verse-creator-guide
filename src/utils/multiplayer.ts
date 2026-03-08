import { supabase } from '@/integrations/supabase/client';

const PLAYER_ID_KEY = 'bubble-pop-player-id';

export const getPlayerId = (): string => {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
};

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export interface MultiplayerSession {
  sessionId: string;
  roomCode: string;
  seed: number;
  status: string;
}

export interface MultiplayerPlayer {
  id: string;
  player_name: string;
  player_id: string;
  score: number;
  level: number;
  is_game_over: boolean;
  joined_at?: string;
}

export const createRoom = async (playerName: string): Promise<MultiplayerSession | null> => {
  const roomCode = generateRoomCode();
  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert({ room_code: roomCode })
    .select()
    .single();
  if (error || !session) return null;

  const playerId = getPlayerId();
  await supabase.from('game_players').insert({
    session_id: session.id,
    player_name: playerName || 'Player',
    player_id: playerId,
  });

  return { sessionId: session.id, roomCode: session.room_code, seed: session.seed, status: session.status };
};

export const joinRoom = async (roomCode: string, playerName: string): Promise<MultiplayerSession | null> => {
  const { data: session, error } = await supabase
    .from('game_sessions')
    .select()
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'waiting')
    .single();
  if (error || !session) return null;

  const playerId = getPlayerId();
  const { error: joinErr } = await supabase.from('game_players').upsert({
    session_id: session.id,
    player_name: playerName || 'Player',
    player_id: playerId,
  }, { onConflict: 'session_id,player_id' });
  if (joinErr) return null;

  return { sessionId: session.id, roomCode: session.room_code, seed: session.seed, status: session.status };
};

export const startGame = async (sessionId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('game_sessions')
    .update({ status: 'playing', started_at: new Date().toISOString() })
    .eq('id', sessionId);
  return !error;
};

export const resetSessionForRematch = async (sessionId: string): Promise<number | null> => {
  // Reset all players' scores
  const { error: playersErr } = await supabase.from('game_players').update({
    score: 0, level: 1, is_game_over: false, last_update: new Date().toISOString(),
  }).eq('session_id', sessionId);
  if (playersErr) return null;

  // Reset session with new seed
  const newSeed = Math.floor(Math.random() * 1000000);
  const { error: sessionErr } = await supabase.from('game_sessions').update({
    status: 'playing', started_at: new Date().toISOString(), ended_at: null, seed: newSeed,
  }).eq('id', sessionId);
  if (sessionErr) return null;
  return newSeed;
};

export const updateScore = async (sessionId: string, score: number, level: number, isGameOver: boolean): Promise<void> => {
  const playerId = getPlayerId();
  await supabase.from('game_players').update({
    score,
    level,
    is_game_over: isGameOver,
    last_update: new Date().toISOString(),
  }).eq('session_id', sessionId).eq('player_id', playerId);
};

export const getPlayers = async (sessionId: string): Promise<MultiplayerPlayer[]> => {
  const { data } = await supabase
    .from('game_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false });
  return (data || []) as MultiplayerPlayer[];
};

export const subscribeToPlayers = (
  sessionId: string,
  onUpdate: (players: MultiplayerPlayer[]) => void
) => {
  const channel = supabase.channel(`room-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_players',
      filter: `session_id=eq.${sessionId}`,
    }, async () => {
      const players = await getPlayers(sessionId);
      onUpdate(players);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToSession = (
  sessionId: string,
  onUpdate: (status: string) => void
) => {
  const channel = supabase.channel(`session-${sessionId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_sessions',
      filter: `id=eq.${sessionId}`,
    }, (payload) => {
      onUpdate((payload.new as any).status);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
