-- Create blood_tests table for storing laboratory results
CREATE TABLE public.blood_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  test_type TEXT,
  biomarkers JSONB NOT NULL DEFAULT '[]', -- Array of { item, value, unit, range, profile, status }
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blood tests" ON public.blood_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blood tests" ON public.blood_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blood tests" ON public.blood_tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blood tests" ON public.blood_tests FOR DELETE USING (auth.uid() = user_id);

-- Index for searching tests by date
CREATE INDEX idx_blood_tests_user_date ON public.blood_tests (user_id, test_date DESC);
