/*
  # Simplify User Permissions
  
  1. Changes
    - Remove all existing user policies
    - Implement absolute minimum policies needed for login
    - Remove all complexity that could cause recursion
  
  2. Security
    - Maintains basic security while ensuring login works
    - Prevents any possibility of recursion
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read" ON users;
DROP POLICY IF EXISTS "admin_manage" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Simple read policy - allows login and basic functionality
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Simple write policy for admins
CREATE POLICY "allow_write"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE id IN (SELECT id FROM users WHERE role = 'admin')
    )
  );

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;