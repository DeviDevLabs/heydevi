
-- Drop the overly permissive INSERT policy on food_items
DROP POLICY IF EXISTS "Authenticated users can insert food items" ON public.food_items;

-- Replace with admin-only INSERT using the security definer function
CREATE POLICY "Only admins can insert food items"
ON public.food_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));
