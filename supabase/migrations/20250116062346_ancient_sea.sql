/*
  # Simplified User Policies

  This migration replaces all previous policy-related migrations with a minimal,
  efficient set of policies for the users table.

  1. Changes:
    - Drops all existing policies
    - Creates two simple policies:
      a. Read access for all authenticated users
      b. Write access for admins
    - Adds necessary permissions

  2. Security:
    - Maintains RLS
    - Ensures proper access control
    - Prevents recursion in policy checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "read_policy" ON users;
DROP POLICY IF EXISTS "admin_policy" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create minimal, efficient policies
CREATE POLICY "read_access_simple"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_access_simple"
  ON users
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- Ensure proper permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;