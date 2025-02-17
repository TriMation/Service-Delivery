import { supabase } from './supabase';
import type { Template, TemplateTask } from '../types/database';

export async function getTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getTemplate(id: string) {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      tasks:template_tasks(
        *,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createTemplate(template: Partial<Template>) {
  const { data, error } = await supabase
    .from('templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, updates: Partial<Template>) {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTemplateTasks(templateId: string) {
  const { data, error } = await supabase
    .from('template_tasks')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('template_id', templateId)
    .order('task_order');

  if (error) throw error;
  return data;
}

export async function createTemplateTask(task: Partial<TemplateTask>) {
  const { data, error } = await supabase
    .from('template_tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplateTask(id: string, updates: Partial<TemplateTask>) {
  const { data, error } = await supabase
    .from('template_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplateTask(id: string) {
  const { error } = await supabase
    .from('template_tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateTemplateTaskParent(
  taskId: string,
  parentId: string | null,
  newOrder: number
) {
  const { error } = await supabase
    .from('template_tasks')
    .update({
      parent_task_id: parentId,
      task_order: newOrder
    })
    .eq('id', taskId);

  if (error) throw error;
}