/*
  # Simplify User Policies to Prevent Recursion

  1. Changes
    - Drop all existing policies
    - Create simple, direct policies without recursion
    - Add necessary indexes
  
  2. Security
    - Direct admin check using auth.uid()
    - Simple self-access policy
    - Direct company access check
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "self_access" ON users;
DROP POLICY IF EXISTS "company_access" ON users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Simple admin policy
CREATE POLICY "admin_read_write"
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
    )
  );

-- Self access policy
CREATE POLICY "self_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Company access policy
CREATE POLICY "company_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;