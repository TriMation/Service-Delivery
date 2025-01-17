/*
  # Update Time Entries Table

  1. Add missing columns
    - project_id (uuid, foreign key to projects)
    - task_id (uuid, foreign key to tasks)
    - hours (numeric)
    - description (text)
    - date (date)

  2. Add indexes and policies
*/

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
CREATE POLICY "time_entries_read_access"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "time_entries_admin_access"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "time_entries_user_access"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON time_entries TO authenticated;