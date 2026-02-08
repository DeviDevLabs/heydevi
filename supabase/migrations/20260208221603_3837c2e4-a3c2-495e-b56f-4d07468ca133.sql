
-- Table to track daily supplement intake
CREATE TABLE public.supplement_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplement_id UUID NOT NULL REFERENCES public.user_supplements(id) ON DELETE CASCADE,
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplement_id, taken_at)
);

ALTER TABLE public.supplement_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplement histories"
  ON public.supplement_histories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplement histories"
  ON public.supplement_histories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplement histories"
  ON public.supplement_histories FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_supplement_histories_user_date
  ON public.supplement_histories (user_id, taken_at DESC);
