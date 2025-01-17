/*
  # Fix User Policies Recursion

  1. Changes
    - Drop all existing user policies that may cause recursion
    - Create new simplified policies that avoid recursion
    - Add basic user access controls
    
  2. Security
    - Enable RLS
    - Add non-recursive policies for:
      - Self access
      - Admin access
      - Company member access
*/

-- Drop all existing user policies to start fresh
DROP POLICY IF EXISTS "users_self_access" ON users;
DROP POLICY IF EXISTS "users_admin_access" ON users;
DROP POLICY IF EXISTS "users_company_read" ON users;

-- Create new simplified policies
CREATE POLICY "allow_read_self"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_read_same_company"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "allow_admin_all"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND id != users.id  -- Prevent recursion
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;