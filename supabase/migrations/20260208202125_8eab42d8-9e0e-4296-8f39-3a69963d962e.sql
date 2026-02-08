
-- 1) Tipo de item: ingrediente vs suplemento
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'ingredient';

-- 2) Unidad del inventario (g, mg, mcg, UI, caps, ml)
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'g';
