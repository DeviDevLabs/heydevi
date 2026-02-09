
-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  );
$$;

-- Users can only check their own admin status
CREATE POLICY "Users can check own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Block all writes from client — manage only from dashboard/SQL
CREATE POLICY "No public inserts"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No public updates"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No public deletes"
ON public.admin_users
FOR DELETE
TO authenticated
USING (false);
