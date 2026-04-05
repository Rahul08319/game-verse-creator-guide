
CREATE TABLE public.high_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL DEFAULT 'Player',
  score INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read high scores"
  ON public.high_scores FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert high scores"
  ON public.high_scores FOR INSERT TO public WITH CHECK (true);

CREATE INDEX idx_high_scores_score ON public.high_scores (score DESC);
