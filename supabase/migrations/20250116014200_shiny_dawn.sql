/*
  # Create initial admin user

  1. Changes
    - Creates an initial admin user for system access
    - Sets up both auth and profile records
    
  2. Security
    - Creates user with admin role
    - Uses secure password hashing
*/

-- Create the admin user
DO $$
DECLARE
  _user_id uuid := gen_random_uuid();
  _encrypted_password text;
BEGIN
  -- Generate encrypted password
  _encrypted_password := crypt('admin123', gen_salt('bf'));

  -- Insert into auth.users with explicit UUID
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    _user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    _encrypted_password,
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create the user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    _user_id,
    'admin@example.com',
    'System Admin',
    'admin',
    now(),
    now()
  );
END $$;