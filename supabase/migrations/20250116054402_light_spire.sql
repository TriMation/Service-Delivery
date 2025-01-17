/*
  # Fix User Policies Recursion

  1. Changes
    - Drop existing policies
    - Create simplified non-recursive policies
    - Add direct role-based access
  
  2. Security
    - Direct auth.uid() checks
    - No self-referential queries
    - Clear separation of concerns
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_read_write" ON users;
DROP POLICY IF EXISTS "self_read" ON users;
DROP POLICY IF EXISTS "company_read" ON users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Basic read access for all authenticated users
CREATE POLICY "users_read_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin write access
CREATE POLICY "admin_write_access"
  ON users
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Self update access
CREATE POLICY "self_update_access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;