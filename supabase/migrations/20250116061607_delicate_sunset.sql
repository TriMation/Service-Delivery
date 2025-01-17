-- Drop ALL existing policies
DO $$
DECLARE
  pol RECORD;  -- Declare the loop variable as a record
BEGIN
  -- Drop all existing policies on the "users" table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ONLY TWO SIMPLE POLICIES with unique names:

-- 1. Everyone can read (needed for login)
CREATE POLICY "users_select_20250116_060825"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Admins can write (simplest possible check)
CREATE POLICY "users_admin_write_20250116_060825"
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

-- Ensure proper permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;