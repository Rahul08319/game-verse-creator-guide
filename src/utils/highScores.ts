
const STORAGE_KEY = 'bubble-shooter-highscores';

export interface HighScore {
  score: number;
  level: number;
  date: string;
  name: string;
}

export const getHighScores = (): HighScore[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as HighScore[];
  } catch {
    return [];
  }
};

export const saveHighScore = (score: number, level: number, name: string = 'Player'): HighScore[] => {
  const scores = getHighScores();
  scores.push({
    score,
    level,
    date: new Date().toLocaleDateString(),
    name
  });
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
  return top10;
};

export const isHighScore = (score: number): boolean => {
  const scores = getHighScores();
  if (scores.length < 10) return score > 0;
  return score > scores[scores.length - 1].score;
};

export const clearHighScores = () => {
  localStorage.removeItem(STORAGE_KEY);
};
