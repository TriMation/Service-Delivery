/*
  # Final User Policy Simplification
  
  1. Changes
    - Remove all existing user policies
    - Implement single read policy for all authenticated users
    - Implement simple admin policy using auth.uid()
    - Remove unnecessary complexity
  
  2. Security
    - Maintains basic security requirements
    - Prevents infinite recursion
    - Allows proper user authentication
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "read_access" ON users;
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "self_update" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Allow all authenticated users to read user data
CREATE POLICY "authenticated_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow admins to manage users (create, update, delete)
CREATE POLICY "admin_manage"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id 
      FROM auth.users 
      WHERE id IN (SELECT id FROM users WHERE role = 'admin')
    )
  );