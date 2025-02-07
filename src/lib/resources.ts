import { supabase } from './supabase';
import type { ResourceMatrix } from '../types/database';

export async function getResourceMatrix() {
  const { data, error } = await supabase
    .from('resource_matrix')
    .select(`
      *,
      user:users(id, email, full_name)
    `)
    .order('created_at');

  if (error) throw error;
  return data;
}

export async function getResourceMatrixForUser(userId: string) {
  const { data, error } = await supabase
    .from('resource_matrix')
    .select()
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createResourceMatrix(resource: Partial<ResourceMatrix>) {
  const { data, error } = await supabase
    .from('resource_matrix')
    .insert(resource)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateResourceMatrix(id: string, updates: Partial<ResourceMatrix>) {
  const { data, error } = await supabase
    .from('resource_matrix')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResourceMatrix(id: string) {
  const { error } = await supabase
    .from('resource_matrix')
    .delete()
    .eq('id', id);

  if (error) throw error;
}