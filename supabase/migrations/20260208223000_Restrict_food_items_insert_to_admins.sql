-- Restrict INSERT on public.food_items to admin users only

-- 1. Create an admin_users table to list allowed admin user IDs
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Remove the overly-broad INSERT policy that allowed all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert food items" ON public.food_items;

-- 3. Add a new policy: only users listed in public.admin_users can INSERT new food_items
CREATE POLICY "Admins can insert food items" ON public.food_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()
    )
  );

-- Note: Manage admin users by inserting/deleting rows in public.admin_users.
-- Example: INSERT INTO public.admin_users (user_id) VALUES ('<uuid>');
