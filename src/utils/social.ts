
export const shareScore = (score: number, level: number, platform: 'twitter' | 'facebook' | 'copy') => {
  const text = `🫧 I scored ${score.toLocaleString()} points (Level ${level}) in Bubble Pop Blast! Can you beat me? 🎮`;
  const url = window.location.origin;

  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
      break;
    case 'copy':
      navigator.clipboard?.writeText(`${text}\n${url}`);
      break;
  }
};

const AVATAR_COLORS = [
  ['#f472b6', '#ec4899'], // pink
  ['#a78bfa', '#8b5cf6'], // purple
  ['#60a5fa', '#3b82f6'], // blue
  ['#34d399', '#10b981'], // green
  ['#fbbf24', '#f59e0b'], // yellow
  ['#f87171', '#ef4444'], // red
  ['#2dd4bf', '#14b8a6'], // teal
  ['#fb923c', '#f97316'], // orange
];

export const getAvatarColor = (name: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getInitials = (name: string): string => {
  return name.slice(0, 2).toUpperCase();
};
