
-- Digestive profile: sensitivities, triggers, fiber tolerance
CREATE TABLE public.digestive_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  lactose_sensitive BOOLEAN DEFAULT false,
  gluten_sensitive BOOLEAN DEFAULT false,
  fiber_tolerance TEXT DEFAULT 'medio' CHECK (fiber_tolerance IN ('bajo', 'medio', 'alto')),
  triggers TEXT[] DEFAULT '{}',
  problem_foods TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.digestive_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digestive profile" ON public.digestive_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own digestive profile" ON public.digestive_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own digestive profile" ON public.digestive_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own digestive profile" ON public.digestive_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_digestive_profiles_updated_at
  BEFORE UPDATE ON public.digestive_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily digestive symptom logs
CREATE TABLE public.digestive_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TEXT,
  symptom TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  associated_meal TEXT,
  associated_recipe_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.digestive_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digestive logs" ON public.digestive_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own digestive logs" ON public.digestive_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own digestive logs" ON public.digestive_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own digestive logs" ON public.digestive_logs FOR DELETE USING (auth.uid() = user_id);

-- Index for querying logs by date range
CREATE INDEX idx_digestive_logs_user_date ON public.digestive_logs (user_id, log_date DESC);
