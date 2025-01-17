/*
  # Add PDF storage support for projects
  
  1. Changes
    - Add pdf_url column to projects table
    - Add statement_of_work column to projects table
    - Create storage bucket for project files
    - Set up storage policies
*/

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS statement_of_work text;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = 'project-files'
);

CREATE POLICY "Anyone can view project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Project owners can update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files')
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Project owners can delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');