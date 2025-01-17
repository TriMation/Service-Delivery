-- Drop existing policies
DROP POLICY IF EXISTS "users_read_all" ON users;
DROP POLICY IF EXISTS "admin_write_access" ON users;
DROP POLICY IF EXISTS "self_update_access" ON users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Allow all authenticated users to read their own profile
CREATE POLICY "read_own_profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow admins to manage all users
CREATE POLICY "admin_manage_users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = id
      AND id IN (SELECT id FROM users WHERE role = 'admin')
    )
  );

-- Allow users to read profiles in their company
CREATE POLICY "read_company_profiles"
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

-- Allow users to update their own profile
CREATE POLICY "update_own_profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;