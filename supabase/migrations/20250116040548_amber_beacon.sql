/*
  # Add allocated hours to projects
  
  1. Changes
    - Add allocated_hours column to projects table
*/

-- Add allocated_hours column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS allocated_hours numeric(10,2) DEFAULT 0;