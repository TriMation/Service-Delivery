-- Create request_comments table
CREATE TABLE request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create request_upvotes table
CREATE TABLE request_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_upvotes ENABLE ROW LEVEL SECURITY;

-- Create policies for request_comments
CREATE POLICY "Users can create comments"
  ON request_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view comments"
  ON request_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for request_upvotes
CREATE POLICY "Clients can manage their upvotes"
  ON request_upvotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'client'
    )
  );

CREATE POLICY "Anyone can view upvotes"
  ON request_upvotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_comments_request ON request_comments(request_id);
CREATE INDEX idx_upvotes_request ON request_upvotes(request_id);
CREATE INDEX idx_upvotes_user ON request_upvotes(user_id);