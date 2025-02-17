import { supabase } from './supabase';
import type { SystemSettings } from '../types/database';

function getDefaultSettings(): SystemSettings {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    organization_name: 'TriMation Service Delivery',
    logo_url: 'https://www.trimation.com.au/wp-content/uploads/2022/05/TriMation-logo.png',
    primary_color: '#4f46e5',
    password_min_length: 8,
    session_timeout: 30,
    two_factor_enabled: false,
    pdf_title_format: '{project_name} - Project Report',
    pdf_font_family: 'Roboto',
    pdf_font_size_body: 10,
    pdf_font_size_header: 18,
    pdf_margin_top: 40,
    pdf_margin_bottom: 40,
    pdf_margin_left: 40,
    pdf_margin_right: 40,
    pdf_footer_text: 'Page {page} of {pages} - Generated on {date}',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as SystemSettings;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select()
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch system settings:', error);
      return getDefaultSettings();
    }

    // If no data, return default settings
    if (!data) {
      return getDefaultSettings();
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching system settings:', error);
    return getDefaultSettings();
  }
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', '00000000-0000-0000-0000-000000000001')  // We only have one settings record
    .select()
    .single();

  if (error) {
    console.error('Failed to update system settings:', error);
    throw error;
  }

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