import { supabase } from './supabase';
import type { Company, User } from '../types/database';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      company:companies(*)
    `)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getClientUsers(clientId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', clientId)
    .order('full_name');

  if (error) throw error;
  return data;
}

export async function createClient(client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}