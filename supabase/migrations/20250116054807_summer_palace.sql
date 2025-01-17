-- Drop all existing policies
DROP POLICY IF EXISTS "read_own_profile" ON users;
DROP POLICY IF EXISTS "admin_manage_users" ON users;
DROP POLICY IF EXISTS "read_company_profiles" ON users;
DROP POLICY IF EXISTS "update_own_profile" ON users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Simple read policy for all authenticated users
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Simple admin policy without recursion
CREATE POLICY "allow_admin_all"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.id IN (
        SELECT id FROM users WHERE role = 'admin'
      )
    )
  );

-- Simple self-update policy
CREATE POLICY "allow_self_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;