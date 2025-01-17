-- Drop existing policies first
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'time_entries'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON time_entries', pol.policyname);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- Add missing columns to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects,
ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks,
ADD COLUMN IF NOT EXISTS hours numeric(5,2) NOT NULL DEFAULT 0 CHECK (hours > 0),
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create simplified policies following purple_temple pattern
CREATE POLICY "time_entries_read_20250116"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "time_entries_admin_20250116"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_entries_user_20250116"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON time_entries TO authenticated;