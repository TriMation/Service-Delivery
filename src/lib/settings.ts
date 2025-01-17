import { supabase } from './supabase';
import type { SystemSettings } from '../types/database';

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  if (error) throw error;
  return data;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', '00000000-0000-0000-0000-000000000001')  // We only have one settings record
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadSettingsImage(file: File, type: 'logo' | 'pdf_header'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  const filePath = `settings/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('settings')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('settings')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function testEmailSettings(settings: {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
}): Promise<boolean> {
  const { error } = await supabase.functions.invoke('test-email-settings', {
    body: settings
  });

  return !error;
}