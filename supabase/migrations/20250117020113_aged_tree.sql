/*
  # Fix password reset function

  1. Changes
    - Enable pgcrypto extension
    - Update admin_reset_password function to use proper password hashing
*/

-- Enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS admin_reset_password;

-- Create the improved password reset function
CREATE OR REPLACE FUNCTION admin_reset_password(
  user_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_password text;
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset passwords';
  END IF;

  -- Hash the password using pgcrypto
  hashed_password := crypt(new_password, gen_salt('bf', 10));

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = hashed_password,
      updated_at = now()
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;