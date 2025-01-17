import { supabase } from './supabase';
import type { Task } from '../types/database';

export async function getTasks(userId: string, isAdmin: boolean) {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      project:projects!inner(
        id,
        name,
        company_id,
        company:companies!inner(
          id,
          name
        )
      ),
      assigned_user:users!tasks_assigned_to_fkey(id, full_name, email)
    `);

  // If not admin, only show assigned tasks
  if (!isAdmin) {
    query = query.eq('assigned_to', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function getProjectTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}