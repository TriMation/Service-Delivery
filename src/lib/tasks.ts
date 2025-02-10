import { supabase } from './supabase';
import type { Task } from '../types/database';

export interface TaskWithHierarchy extends Task {
  children?: TaskWithHierarchy[];
  level: number;
  totalHours: number;
}

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

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .throwOnError();

  if (error) throw error;
  return data;
}

export async function createTask(task: Partial<Task>) {
  // Get the current max task_order for the project
  const { data: maxOrderTask } = await supabase
    .from('tasks')
    .select('task_order')
    .eq('project_id', task.project_id)
    .is('parent_task_id', task.parent_task_id || null)
    .order('task_order', { ascending: false })
    .limit(1);

  const nextOrder = maxOrderTask?.[0]?.task_order + 1 || 0;

  // Clean up dates before inserting
  const cleanTask = {
    ...task,
    start_date: task.start_date || null,
    due_date: task.due_date || null,
    parent_task_id: task.parent_task_id || null,
    task_order: nextOrder
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(cleanTask)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  // Clean up dates before updating
  const cleanUpdates = {
    ...updates,
    start_date: updates.start_date || null,
    due_date: updates.due_date || null,
    parent_task_id: updates.parent_task_id || null
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(cleanUpdates)
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

// Get tasks for a specific project with related data
export async function getProjectTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:users!tasks_assigned_to_fkey(id, full_name, email)
    `)
    .eq('project_id', projectId)
    .order('task_number', { ascending: true });

  if (error) throw error;
  return data;
}

export async function reorderTask(taskId: string, newOrder: number) {
  const { error } = await supabase
    .from('tasks')
    .update({ task_order: newOrder })
    .eq('id', taskId);

  if (error) throw error;
}

export async function updateTaskDependency(taskId: string, dependencyId: string | null) {
  const { error } = await supabase
    .from('tasks')
    .update({ dependency_task_id: dependencyId })
    .eq('id', taskId);

  if (error) throw error;
}

export async function updateTaskParent(taskId: string, parentId: string | null, newOrder: number) {
  // First update the parent and order
  const { error } = await supabase
    .from('tasks')
    .update({
      parent_task_id: parentId,
      task_order: newOrder
    })
    .eq('id', taskId);

  if (error) throw error;

  // Then reorder affected siblings - handle both root and child tasks
  let query = supabase
    .from('tasks')
    .select('id, task_order');

  if (parentId === null) {
    // For root level tasks
    query = query.is('parent_task_id', null);
  } else {
    // For child tasks
    query = query.eq('parent_task_id', parentId);
  }

  const { data: siblings } = await query
    .neq('id', taskId)
    .gte('task_order', newOrder)
    .order('task_order', { ascending: true });

  if (siblings) {
    for (let i = 0; i < siblings.length; i++) {
      const { error } = await supabase
        .from('tasks')
        .update({ task_order: newOrder + i + 1 })
        .eq('id', siblings[i].id);

      if (error) throw error;
    }
  }
}