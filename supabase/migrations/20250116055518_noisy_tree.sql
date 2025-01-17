/*
  # Simplify User Policies and Access Control
  
  This migration implements a minimal, secure approach to user policies:
  1. One simple read policy for all authenticated users
  2. One simple admin policy without complex joins
  3. One simple self-update policy
  4. No recursive queries or complex conditions
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "basic_read_access" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "self_update_access" ON users;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 1. Simple read policy - everyone can read all user profiles
CREATE POLICY "read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Simple admin policy - direct check against auth.uid()
CREATE POLICY "admin_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- 3. Simple self-update policy - users can update their own profile
CREATE POLICY "self_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;