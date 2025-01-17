/*
  # Add system settings table

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `organization_name` (text)
      - `logo_url` (text)
      - `primary_color` (text)
      - `password_min_length` (integer)
      - `session_timeout` (integer)
      - `two_factor_enabled` (boolean)
      - `pdf_header_image` (text)
      - `pdf_title_format` (text)
      - `pdf_font_family` (text)
      - `pdf_font_size_body` (integer)
      - `pdf_font_size_header` (integer)
      - `pdf_margin_top` (integer)
      - `pdf_margin_bottom` (integer)
      - `pdf_margin_left` (integer)
      - `pdf_margin_right` (integer)
      - `pdf_footer_text` (text)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_username` (text)
      - `smtp_password` (text)
      - `smtp_from_email` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for admin access
*/

-- Create system_settings table
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL DEFAULT 'TaskFlow',
  logo_url text,
  primary_color text DEFAULT '#4f46e5',
  password_min_length integer DEFAULT 8,
  session_timeout integer DEFAULT 30,
  two_factor_enabled boolean DEFAULT false,
  pdf_header_image text,
  pdf_title_format text DEFAULT '{project_name} - Project Report',
  pdf_font_family text DEFAULT 'Roboto',
  pdf_font_size_body integer DEFAULT 10,
  pdf_font_size_header integer DEFAULT 18,
  pdf_margin_top integer DEFAULT 40,
  pdf_margin_bottom integer DEFAULT 40,
  pdf_margin_left integer DEFAULT 40,
  pdf_margin_right integer DEFAULT 40,
  pdf_footer_text text DEFAULT 'Page {page} of {pages} - Generated on {date}',
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text,
  smtp_from_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create storage bucket for settings files
INSERT INTO storage.buckets (id, name, public)
VALUES ('settings', 'settings', true);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload settings files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'settings'
  AND (storage.foldername(name))[1] = 'settings'
);

CREATE POLICY "Anyone can view settings files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'settings');

-- Insert default settings using a proper UUID
INSERT INTO system_settings (id, organization_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'TaskFlow')
ON CONFLICT (id) DO NOTHING;