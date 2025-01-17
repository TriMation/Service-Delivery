/*
  # Fix user policies to prevent recursion

  This migration simplifies the user policies to prevent infinite recursion while maintaining security:
  
  1. Drops existing policies that may cause recursion
  2. Creates new simplified policies:
     - Basic read access for all authenticated users
     - Admin access based on auth.users join
     - Self-update capability
  3. Maintains existing indexes
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;
DROP POLICY IF EXISTS "allow_self_update" ON users;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Basic read policy - allows all authenticated users to read user profiles
CREATE POLICY "basic_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin policy - uses direct join with auth.users to prevent recursion
CREATE POLICY "admin_full_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users au
      JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid()
      AND u.role = 'admin'
      AND u.id != users.id  -- Prevent self-reference
    )
  );

-- Self update policy - allows users to update their own profile
CREATE POLICY "self_update_access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;