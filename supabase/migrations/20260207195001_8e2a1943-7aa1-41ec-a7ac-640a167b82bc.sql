
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  age INTEGER,
  sex TEXT DEFAULT 'female',
  activity_level TEXT DEFAULT 'high',
  training_time TEXT DEFAULT '06:00',
  protein_target INTEGER DEFAULT 100,
  calorie_target INTEGER,
  restrictions JSONB DEFAULT '{"sin_huevo": true, "con_lacteos": true, "sin_azucar": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  category TEXT NOT NULL,
  grams_available NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ingredient_name)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.inventory FOR DELETE USING (auth.uid() = user_id);

-- Consumed meals table
CREATE TABLE public.consumed_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consumed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_label TEXT NOT NULL,
  meal_time TEXT,
  recipe_id TEXT,
  description TEXT,
  protein NUMERIC NOT NULL DEFAULT 0,
  calories NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consumed_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consumed meals" ON public.consumed_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consumed meals" ON public.consumed_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consumed meals" ON public.consumed_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own consumed meals" ON public.consumed_meals FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
