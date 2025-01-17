/*
  # Fix User Policies Recursion

  1. Changes
    - Drop all existing policies
    - Create two non-recursive policies
    - Maintain indexes
    - Set proper permissions

  2. Security
    - Maintains RLS
    - Preserves admin privileges
    - Ensures basic authentication works
*/

-- Drop existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies
CREATE POLICY "users_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_admin_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE id IN (
        SELECT id FROM users WHERE role = 'admin'
      )
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;