import { supabase } from './supabase';
import type { TimeEntry } from '../types/database';

interface TimeFilters {
  search: string;
  dateRange: string;
  project: string;
  user: string;
}

export async function getTimeEntries(userId: string, isAdmin: boolean, filters: TimeFilters) {
  let query = supabase
    .from('time_entries')
    .select(`
      *,
      project:projects(id, name, company:companies(id, name)),
      task:tasks(id, title),
      user:users(id, full_name, email)
    `);

  // Apply date range filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filters.dateRange) {
    case 'today':
      query = query.eq('date', today.toISOString());
      break;
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      query = query.gte('date', weekStart.toISOString());
      break;
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      query = query.gte('date', monthStart.toISOString());
      break;
    }
  }

  // Apply project filter
  if (filters.project) {
    query = query.eq('project_id', filters.project);
  }

  // Apply user filter
  if (filters.user) {
    query = query.eq('user_id', filters.user);
  }

  // If not admin, only show user's entries
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTimeEntry(entry: Partial<TimeEntry>) {
  // Validate all required fields upfront
  const requiredFields = {
    project_id: 'Project is required',
    user_id: 'User is required',
    date: 'Date is required'
  };

  for (const [field, message] of Object.entries(requiredFields)) {
    if (!entry[field]) {
      throw new Error(message);
    }
  }

  // Validate hours separately since it needs numeric check
  if (!entry.hours || isNaN(entry.hours) || entry.hours <= 0) {
    throw new Error('Hours must be greater than 0');
  }

  // Clean up the entry data
  const cleanEntry = {
    ...entry,
    // Only include task_id if it has a value
    task_id: entry.task_id || undefined,
    // Ensure date is in the correct format
    date: new Date(entry.date).toISOString().split('T')[0],
    // Ensure hours is a number
    hours: Number(entry.hours)
  };

  const { data, error } = await supabase
    .from('time_entries')
    .insert(cleanEntry)
    .select()
    .single();

  if (error) {
    console.error('Time entry creation error:', error);
    throw new Error('Failed to create time entry. Please try again.');
  }

  return data;
}

export async function updateTimeEntry(id: string, updates: Partial<TimeEntry>) {
  // Validate required fields if they are being updated
  if (updates.project_id === undefined || updates.project_id === '') {
    throw new Error('Project is required');
  }
  if (updates.hours !== undefined && updates.hours <= 0) {
    throw new Error('Hours must be greater than 0');
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTimeEntry(id: string) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}