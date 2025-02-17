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
    .select(`*,
      tasks:template_tasks(*,
        skill:skills(*)),
      requirements:template_requirements(*),
      benefits:template_anticipated_benefits(*)`)
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
  // Extract requirements and benefits from updates
  const { requirements, benefits, ...templateData } = updates;

  // Update the template basic data
  const { data: template, error: templateError } = await supabase 
    .from('templates')
    .update(templateData)
    .eq('id', id)
    .select()
    .single();

  if (templateError) throw templateError;

  // Handle requirements update
  if (requirements) {
    // Delete existing requirements
    const { error: deleteError } = await supabase
      .from('template_requirements')
      .delete()
      .eq('template_id', id);

    if (deleteError) throw deleteError;

    // Insert new requirements if any exist
    if (requirements.length > 0) {
      const { error: insertError } = await supabase
        .from('template_requirements')
        .insert(
          requirements.map(req => ({
            template_id: id,
            requirement_text: req.requirement_text,
            is_met: req.is_met || false,
            deliverables_rich_text: req.deliverables_rich_text
          }))
        ).select();

      if (insertError) throw insertError;
    }
  }

  return template;
}

export async function createTemplateRequirement(requirement: Partial<TemplateRequirement>) {
  const { data, error } = await supabase
    .from('template_requirements')
    .insert(requirement)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplateRequirement(id: string, updates: Partial<TemplateRequirement>) {
  const { data, error } = await supabase
    .from('template_requirements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplateRequirement(id: string) {
  const { error } = await supabase
    .from('template_requirements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createTemplateBenefit(benefit: Partial<TemplateBenefit>) {
  const { data, error } = await supabase
    .from('template_anticipated_benefits')
    .insert(benefit)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplateBenefit(id: string, updates: Partial<TemplateBenefit>) {
  const { data, error } = await supabase
    .from('template_anticipated_benefits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplateBenefit(id: string) {
  const { error } = await supabase
    .from('template_anticipated_benefits')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
    .eq('id', taskId);import { supabase } from './supabase';
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
        .select(`*,
          tasks:template_tasks(*,
            skill:skills(*)),
          requirements:template_requirements(*),
          benefits:template_anticipated_benefits(*)`)
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
      // Extract requirements and benefits from updates
      const { requirements, benefits, ...templateData } = updates;
    
      // Update the template basic data
      const { data: template, error: templateError } = await supabase 
        .from('templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();
    
      if (templateError) throw templateError;
    
      // Handle requirements update
      if (requirements) {
        // Delete existing requirements
        const { error: deleteError } = await supabase
          .from('template_requirements')
          .delete()
          .eq('template_id', id);
    
        if (deleteError) throw deleteError;
    
        // Insert new requirements if any exist
        if (requirements.length > 0) {
          const { error: insertError } = await supabase
            .from('template_requirements')
            .insert(
              requirements.map(req => ({
                template_id: id,
                requirement_text: req.requirement_text,
                is_met: req.is_met || false,
                deliverables_rich_text: req.deliverables_rich_text
              }))
            ).select();
    
          if (insertError) throw insertError;
        }
      }
    
      // Handle benefits update
      if (benefits) {
        // Delete existing benefits
        const { error: deleteError } = await supabase
          .from('template_anticipated_benefits')
          .delete()
          .eq('template_id', id);
    
        if (deleteError) throw deleteError;
    
        // Insert new benefits if any exist
        if (benefits.length > 0) {
          const { error: insertError } = await supabase
            .from('template_anticipated_benefits')
            .insert(
              benefits.map(benefit => ({
                template_id: id,
                anticipated_benefit: benefit.anticipated_benefit,
                example: benefit.example || '',
                measurement: benefit.measurement || ''
              }))
            ).select();
    
          if (insertError) throw insertError;
        }
      }
    
      return template;
    }
    
    export async function createTemplateRequirement(requirement: Partial<TemplateRequirement>) {
      const { data, error } = await supabase
        .from('template_requirements')
        .insert(requirement)
        .select()
        .single();
    
      if (error) throw error;
      return data;
    }
    
    export async function updateTemplateRequirement(id: string, updates: Partial<TemplateRequirement>) {
      const { data, error } = await supabase
        .from('template_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
      if (error) throw error;
      return data;
    }
    
    export async function deleteTemplateRequirement(id: string) {
      const { error } = await supabase
        .from('template_requirements')
        .delete()
        .eq('id', id);
    
      if (error) throw error;
    }
    
    export async function createTemplateBenefit(benefit: Partial<TemplateBenefit>) {
      const { data, error } = await supabase
        .from('template_anticipated_benefits')
        .insert(benefit)
        .select()
        .single();
    
      if (error) throw error;
      return data;
    }
    
    export async function updateTemplateBenefit(id: string, updates: Partial<TemplateBenefit>) {
      const { data, error } = await supabase
        .from('template_anticipated_benefits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
      if (error) throw error;
      return data;
    }
    
    export async function deleteTemplateBenefit(id: string) {
      const { error } = await supabase
        .from('template_anticipated_benefits')
        .delete()
        .eq('id', id);
    
      if (error) throw error;
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

  if (error) throw error;
}