-- Profile histories table
CREATE TABLE public.profile_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile histories" ON public.profile_histories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile histories" ON public.profile_histories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: index to speed queries by user and date
CREATE INDEX IF NOT EXISTS profile_histories_user_created_idx ON public.profile_histories (user_id, created_at DESC);
