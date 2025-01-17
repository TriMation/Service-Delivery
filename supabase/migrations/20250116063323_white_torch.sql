/*
  # Simplify Authentication Policies

  1. Changes
    - Drop all existing complex policies
    - Create two simple, efficient policies:
      a. Read access for authentication
      b. Write access for admins
    - Maintain necessary indexes
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

-- Create minimal, efficient policies
CREATE POLICY "users_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_admin"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND id IN (SELECT id FROM users WHERE role = 'admin')
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;