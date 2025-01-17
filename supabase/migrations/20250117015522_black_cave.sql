/*
  # Add password reset functionality

  1. New Functions
    - `admin_reset_password` - Allows admins to reset user passwords
  
  2. Security
    - Function is only accessible to admin users
    - Validates admin role before allowing password reset
*/

-- Create admin password reset function
CREATE OR REPLACE FUNCTION admin_reset_password(
  user_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset passwords';
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id;
END;
$$;