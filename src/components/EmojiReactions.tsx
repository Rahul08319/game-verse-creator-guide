import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPlayerId } from '../utils/multiplayer';

interface Props {
  sessionId: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  playerName?: string;
  createdAt: number;
}

const EMOJIS = ['🔥', '😂', '👏', '😱', '💀', '🎯', '❤️', '🤯'];

const EmojiReactions: React.FC<Props> = ({ sessionId }) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`reactions-${sessionId}`)
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        if (!payload) return;
        const fe: FloatingEmoji = {
          id: crypto.randomUUID(),
          emoji: payload.emoji,
          x: 10 + Math.random() * 80,
          playerName: payload.playerName,
          createdAt: Date.now(),
        };
        setFloatingEmojis(prev => [...prev.slice(-12), fe]);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Clean up old floating emojis
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingEmojis(prev => prev.filter(e => Date.now() - e.createdAt < 2500));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    if (cooldown || !channelRef.current) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);
    channelRef.current.send({
      type: 'broadcast',
      event: 'emoji',
      payload: { emoji, playerId: getPlayerId(), playerName: 'You' },
    });
  }, [cooldown]);

  return (
    <>
      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
        {floatingEmojis.map(fe => (
          <div
            key={fe.id}
            className="absolute animate-emoji-float text-2xl"
            style={{
              left: `${fe.x}%`,
              bottom: '10%',
            }}
          >
            {fe.emoji}
          </div>
        ))}
      </div>

      {/* Emoji bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            disabled={cooldown}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm hover:scale-125 hover:bg-white/10 transition-all ${
              cooldown ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};

export default EmojiReactions;
