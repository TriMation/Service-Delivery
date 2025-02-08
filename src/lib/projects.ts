import { supabase } from './supabase';
import type { Project } from '../types/database';

export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      company:companies(*),
      tasks:tasks!tasks_project_id_fkey(id, status),
      time_entries(id, hours)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function uploadProjectPDF(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `project-files/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getProjects(userId: string, isAdmin: boolean) {
  let query = supabase
    .from('projects')
    .select(`  
      *,
      company:companies(*),
      tasks:tasks!tasks_project_id_fkey(id, status),
      time_entries(id, hours)
    `);

  // If not admin, only show projects from user's company
  if (!isAdmin) {
    query = query.eq('company_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProject(project: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}