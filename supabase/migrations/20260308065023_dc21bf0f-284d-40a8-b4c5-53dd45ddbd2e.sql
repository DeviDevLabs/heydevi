CREATE TABLE public.suspect_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  eaten_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suspect_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suspect foods" ON public.suspect_foods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suspect foods" ON public.suspect_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suspect foods" ON public.suspect_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suspect foods" ON public.suspect_foods FOR DELETE USING (auth.uid() = user_id);