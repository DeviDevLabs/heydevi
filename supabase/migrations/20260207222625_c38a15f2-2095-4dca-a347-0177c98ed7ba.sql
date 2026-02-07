
-- 1. Canonical food items catalog
CREATE TABLE public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  category text NOT NULL DEFAULT 'otros',
  default_unit text NOT NULL DEFAULT 'g',
  synonyms text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Food items are readable by all authenticated" ON public.food_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert food items" ON public.food_items FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Purchases history
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_item_id uuid REFERENCES public.food_items(id) ON DELETE CASCADE NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g',
  purchased_at timestamptz NOT NULL DEFAULT now(),
  week_start date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

-- 3. User supplements
CREATE TABLE public.user_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  brand text,
  form text DEFAULT 'caps',
  default_unit text DEFAULT 'mg',
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own supplements" ON public.user_supplements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own supplements" ON public.user_supplements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplements" ON public.user_supplements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplements" ON public.user_supplements FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_supplements_updated_at
  BEFORE UPDATE ON public.user_supplements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Supplement regimens (dosage history)
CREATE TABLE public.supplement_regimens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  supplement_id uuid REFERENCES public.user_supplements(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date,
  dose_value numeric NOT NULL,
  dose_unit text NOT NULL DEFAULT 'mg',
  frequency text NOT NULL DEFAULT 'daily',
  time_of_day text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplement_regimens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own regimens" ON public.supplement_regimens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own regimens" ON public.supplement_regimens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own regimens" ON public.supplement_regimens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own regimens" ON public.supplement_regimens FOR DELETE USING (auth.uid() = user_id);

-- 5. Food experiments
CREATE TABLE public.food_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_item_id uuid REFERENCES public.food_items(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  target_dose text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own experiments" ON public.food_experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experiments" ON public.food_experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiments" ON public.food_experiments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiments" ON public.food_experiments FOR DELETE USING (auth.uid() = user_id);

-- 6. Enhance digestive_logs with new columns
ALTER TABLE public.digestive_logs
  ADD COLUMN IF NOT EXISTS bristol integer,
  ADD COLUMN IF NOT EXISTS frequency integer,
  ADD COLUMN IF NOT EXISTS urgency integer,
  ADD COLUMN IF NOT EXISTS bloating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pain integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reflux integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy integer,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric,
  ADD COLUMN IF NOT EXISTS stress integer,
  ADD COLUMN IF NOT EXISTS alcohol boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS coffee boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle_phase text,
  ADD COLUMN IF NOT EXISTS meds_notes text;

-- 7. Meal logs
CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  tags text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meal logs" ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal logs" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal logs" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal logs" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.meal_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id uuid REFERENCES public.meal_logs(id) ON DELETE CASCADE NOT NULL,
  food_item_id uuid REFERENCES public.food_items(id) ON DELETE CASCADE NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g'
);
ALTER TABLE public.meal_log_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meal log items" ON public.meal_log_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meal_logs ml WHERE ml.id = meal_log_id AND ml.user_id = auth.uid())
);
CREATE POLICY "Users can insert own meal log items" ON public.meal_log_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.meal_logs ml WHERE ml.id = meal_log_id AND ml.user_id = auth.uid())
);
CREATE POLICY "Users can update own meal log items" ON public.meal_log_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.meal_logs ml WHERE ml.id = meal_log_id AND ml.user_id = auth.uid())
);
CREATE POLICY "Users can delete own meal log items" ON public.meal_log_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.meal_logs ml WHERE ml.id = meal_log_id AND ml.user_id = auth.uid())
);

-- 8. Add food_item_id to inventory for canonical linking
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS food_item_id uuid REFERENCES public.food_items(id);

-- 9. Seed food_items with common ingredients from recipes
INSERT INTO public.food_items (name, canonical_name, category, default_unit, synonyms) VALUES
  ('tofu firme', 'tofu firme', 'proteinas', 'g', '{"tofu","tofu extra firme"}'),
  ('tempeh', 'tempeh', 'proteinas', 'g', '{}'),
  ('lentejas', 'lentejas', 'proteinas', 'g', '{"lenteja","lentejas rojas","lentejas verdes"}'),
  ('garbanzos', 'garbanzos', 'proteinas', 'g', '{"garbanzo","garbanzos cocidos"}'),
  ('frijoles negros', 'frijoles negros', 'proteinas', 'g', '{"frijol negro","frijoles"}'),
  ('edamame', 'edamame', 'proteinas', 'g', '{}'),
  ('leche de soya', 'leche de soya', 'lacteos', 'ml', '{"leche soya","leche de soja"}'),
  ('yogurt griego', 'yogurt griego', 'lacteos', 'g', '{"yogur griego","yoghurt griego"}'),
  ('queso cottage', 'queso cottage', 'lacteos', 'g', '{"cottage","requesón"}'),
  ('queso panela', 'queso panela', 'lacteos', 'g', '{"panela"}'),
  ('brocoli', 'brocoli', 'verduras', 'g', '{"brócoli","brecol"}'),
  ('espinacas', 'espinacas', 'verduras', 'g', '{"espinaca"}'),
  ('kale', 'kale', 'verduras', 'g', '{"col rizada"}'),
  ('calabacin', 'calabacin', 'verduras', 'g', '{"calabacín","zucchini"}'),
  ('zanahoria', 'zanahoria', 'verduras', 'g', '{"zanahorias"}'),
  ('jitomate', 'jitomate', 'verduras', 'g', '{"tomate","jitomates"}'),
  ('cebolla', 'cebolla', 'verduras', 'g', '{"cebollas"}'),
  ('ajo', 'ajo', 'condimentos', 'g', '{"ajos","diente de ajo"}'),
  ('platano', 'platano', 'frutas', 'g', '{"plátano","banana","banano"}'),
  ('manzana', 'manzana', 'frutas', 'g', '{"manzanas"}'),
  ('arandanos', 'arandanos', 'frutas', 'g', '{"arándanos","blueberries"}'),
  ('fresas', 'fresas', 'frutas', 'g', '{"fresa","strawberries"}'),
  ('avena', 'avena', 'granos', 'g', '{"avena en hojuelas","hojuelas de avena"}'),
  ('arroz integral', 'arroz integral', 'granos', 'g', '{"arroz","arroz café"}'),
  ('quinoa', 'quinoa', 'granos', 'g', '{"quinua","kinwa"}'),
  ('pan integral', 'pan integral', 'granos', 'g', '{"pan","pan de caja integral"}'),
  ('tortilla de maiz', 'tortilla de maiz', 'granos', 'g', '{"tortilla","tortillas"}'),
  ('pasta integral', 'pasta integral', 'granos', 'g', '{"pasta","espagueti integral"}'),
  ('linaza', 'linaza', 'semillas', 'g', '{"semilla de lino","flaxseed"}'),
  ('chia', 'chia', 'semillas', 'g', '{"chía","semillas de chía"}'),
  ('almendras', 'almendras', 'semillas', 'g', '{"almendra"}'),
  ('nueces', 'nueces', 'semillas', 'g', '{"nuez","nuez de castilla"}'),
  ('crema de cacahuate', 'crema de cacahuate', 'semillas', 'g', '{"mantequilla de maní","peanut butter"}'),
  ('aguacate', 'aguacate', 'semillas', 'g', '{"palta"}'),
  ('aceite de oliva', 'aceite de oliva', 'condimentos', 'ml', '{"aceite oliva","olive oil"}'),
  ('salsa de soya', 'salsa de soya', 'condimentos', 'ml', '{"soya","salsa soja"}'),
  ('levadura nutricional', 'levadura nutricional', 'condimentos', 'g', '{"nutritional yeast"}'),
  ('chucrut', 'chucrut', 'verduras', 'g', '{"sauerkraut","col fermentada"}'),
  ('proteina en polvo', 'proteina en polvo', 'proteinas', 'g', '{"whey","proteína","protein powder"}')
ON CONFLICT (name) DO NOTHING;
