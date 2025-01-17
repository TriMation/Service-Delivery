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

-- ABSOLUTE MINIMUM POLICIES with unique names:

-- 1. Basic read access (required for login)
CREATE POLICY "users_basic_read_20250116"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Admin access (simplest possible)
CREATE POLICY "users_admin_access_20250116"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Ensure proper permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;