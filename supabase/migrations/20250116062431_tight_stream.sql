-- Drop all existing policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "self_access" ON users;
DROP POLICY IF EXISTS "company_access" ON users;
DROP POLICY IF EXISTS "users_basic_read" ON users;
DROP POLICY IF EXISTS "users_admin_access" ON users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "users_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_admin_access"
  ON users
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;