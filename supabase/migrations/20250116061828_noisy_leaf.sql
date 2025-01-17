-- Drop existing policies
DROP POLICY IF EXISTS "users_basic_read_20250116061715" ON users;
DROP POLICY IF EXISTS "users_admin_access_20250116061715" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic read access (required for login)
CREATE POLICY "read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin access (minimal check)
CREATE POLICY "admin_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- Ensure permissions
GRANT ALL ON users TO authenticated;