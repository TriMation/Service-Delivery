-- Drop existing policies
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

-- Add NOT NULL constraint to critical fields
ALTER TABLE time_entries 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN project_id SET NOT NULL,
ALTER COLUMN hours SET NOT NULL,
ALTER COLUMN date SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "time_entries_select_20250116"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own entries
    user_id = auth.uid()
    OR
    -- Admins can view all entries
    EXISTS (
      SELECT 1 
      FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_entries_insert_20250116"
  ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create entries for themselves
    user_id = auth.uid()
  );

CREATE POLICY "time_entries_update_20250116"
  ON time_entries
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own entries
    user_id = auth.uid()
    OR
    -- Admins can update any entry
    EXISTS (
      SELECT 1 
      FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    -- Users can only update their own entries
    user_id = auth.uid()
    OR
    -- Admins can update any entry
    EXISTS (
      SELECT 1 
      FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_entries_delete_20250116"
  ON time_entries
  FOR DELETE
  TO authenticated
  USING (
    -- Users can delete their own entries
    user_id = auth.uid()
    OR
    -- Admins can delete any entry
    EXISTS (
      SELECT 1 
      FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON time_entries TO authenticated;