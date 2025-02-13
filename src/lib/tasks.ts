// tasks.ts
import { supabase } from './supabase';
import type { Task } from '../types/database';

export interface TaskFilters {
  clientId?: string;
  projectId?: string;
}

/**
 * Fetch tasks from the database.
 * - Admin => sees all tasks
 * - Non-admin => sees only tasks assigned to them
 * - Always includes time_entries(hours) for total hours
 * - Optional clientId => filters by project.company_id
 * - Optional projectId => filters by project_id
 */
export async function getTasks(
  userId: string,
  isAdmin: boolean,
  filters?: TaskFilters
): Promise<Task[]> {
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
      assigned_user:users!tasks_assigned_to_fkey(id, full_name, email),
      time_entries(hours)
    `)
    .order('created_at', { ascending: false })
    .throwOnError();

  // Non-admin => only tasks assigned to the given user
  if (!isAdmin) {
    query = query.eq('assigned_to', userId);
  }

  // Filter by client => match project.company_id
  if (filters?.clientId) {
    query = query.eq('project.company_id', filters.clientId);
  }

  // Filter by specific project
  if (filters?.projectId) {
    query = query.eq('project_id', filters.projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTask(task: Partial<Task>) {
  const { required_skills, progress, ...taskData } = task;

  // Setup default or cleaned fields
  const cleanTask = {
    ...taskData,
    start_date: taskData.start_date || null,
    due_date: taskData.due_date || null,
    parent_task_id: taskData.parent_task_id || null,
    progress: 0,
    task_order: await getNextTaskOrder(taskData.project_id, taskData.parent_task_id),
  };

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert(cleanTask)
    .select()
    .single();

  if (error) throw error;

  // Insert any required skills
  if (required_skills?.length) {
    const { error: skillsError } = await supabase
      .from('task_skills')
      .insert(
        required_skills.map((skillId) => ({
          task_id: newTask.id,
          skill_id: skillId,
        }))
      );
    if (skillsError) throw skillsError;
  }

  return newTask;
}

// Helper to set task_order among sibling tasks
async function getNextTaskOrder(
  projectId?: string,
  parentTaskId?: string | null
): Promise<number> {
  if (!projectId) return 0;

  const { data: maxOrderTask } = await supabase
    .from('tasks')
    .select('task_order')
    .eq('project_id', projectId)
    .is('parent_task_id', parentTaskId || null)
    .order('task_order', { ascending: false })
    .limit(1);

  return maxOrderTask?.[0]?.task_order + 1 || 0;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { required_skills, progress, ...taskUpdates } = updates;

  let calculatedProgress = progress;
  if (taskUpdates.status === 'completed') {
    calculatedProgress = 100;
  } else if (calculatedProgress === undefined) {
    // keep existing progress if none specified
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('progress')
      .eq('id', taskId)
      .single();
    calculatedProgress = currentTask?.progress || 0;
  }

  const cleanUpdates = {
    ...taskUpdates,
    progress: Math.min(Math.max(calculatedProgress || 0, 0), 100),
    start_date: taskUpdates.start_date || null,
    due_date: taskUpdates.due_date || null,
    parent_task_id: taskUpdates.parent_task_id || null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(cleanUpdates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;

  // Update skills if provided
  if (required_skills) {
    // remove all
    const { error: deleteError } = await supabase
      .from('task_skills')
      .delete()
      .eq('task_id', taskId);
    if (deleteError) throw deleteError;

    // re-insert
    if (required_skills.length > 0) {
      const { error: skillsError } = await supabase
        .from('task_skills')
        .insert(
          required_skills.map((skillId) => ({
            task_id: taskId,
            skill_id: skillId,
          }))
        );
      if (skillsError) throw skillsError;
    }
  }

  return data;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Optionally fetch tasks for a single project, including time_entries
 */
export async function getProjectTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:users!tasks_assigned_to_fkey(id, full_name, email),
      time_entries(hours)
    `)
    .eq('project_id', projectId)
    .order('task_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function reorderTask(taskId: string, newOrder: number) {
  const { error } = await supabase
    .from('tasks')
    .update({ task_order: newOrder })
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Optional: update task dependency
 */
export async function updateTaskDependency(taskId: string, dependencyId: string | null) {
  const { error } = await supabase
    .from('tasks')
    .update({ dependency_task_id: dependencyId })
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Optional: move a task under a new parent
 */
export async function updateTaskParent(
  taskId: string,
  parentId: string | null,
  newOrder: number
) {
  // Update the parent
  const { error } = await supabase
    .from('tasks')
    .update({ parent_task_id: parentId, task_order: newOrder })
    .eq('id', taskId);

  if (error) throw error;

  // reorder siblings
  let siblingQuery = supabase
    .from('tasks')
    .select('id, task_order');

  if (parentId === null) {
    siblingQuery = siblingQuery.is('parent_task_id', null);
  } else {
    siblingQuery = siblingQuery.eq('parent_task_id', parentId);
  }

  const { data: siblings, error: siblingError } = await siblingQuery
    .neq('id', taskId)
    .gte('task_order', newOrder)
    .order('task_order', { ascending: true });

  if (siblingError) throw siblingError;

  if (siblings) {
    for (let i = 0; i < siblings.length; i++) {
      const updatedOrder = newOrder + i + 1;
      const { error: reorderErr } = await supabase
        .from('tasks')
        .update({ task_order: updatedOrder })
        .eq('id', siblings[i].id);

      if (reorderErr) throw reorderErr;
    }
  }
}
