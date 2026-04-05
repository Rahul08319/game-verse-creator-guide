
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = 'bubble-shooter-highscores';

export interface HighScore {
  score: number;
  level: number;
  date: string;
  name: string;
}

// Local fallback
export const getHighScores = (): HighScore[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as HighScore[];
  } catch {
    return [];
  }
};

export const getGlobalHighScores = async (): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('player_name, score, level, created_at')
      .order('score', { ascending: false })
      .limit(20);

    if (error || !data) return getHighScores();

    return data.map(row => ({
      score: row.score,
      level: row.level,
      date: new Date(row.created_at).toLocaleDateString(),
      name: row.player_name,
    }));
  } catch {
    return getHighScores();
  }
};

export const saveHighScore = async (score: number, level: number, name: string = 'Player'): Promise<HighScore[]> => {
  // Save locally
  const scores = getHighScores();
  scores.push({ score, level, date: new Date().toLocaleDateString(), name });
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));

  // Save to database
  try {
    await supabase.from('high_scores').insert({
      player_name: name,
      score,
      level,
    });
  } catch {
    // silent fail, local score already saved
  }

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
