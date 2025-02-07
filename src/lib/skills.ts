import { supabase } from './supabase';
import type { Skill, SkillMatrix } from '../types/database';

export async function getSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createSkill(name: string) {
  const { data, error } = await supabase
    .from('skills')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSkill(id: string) {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSkillsMatrix() {
  const { data, error } = await supabase
    .from('skills_matrix')
    .select(`
      *,
      user:users(id, email, full_name),
      skill:skills(id, name)
    `)
    .order('created_at');

  if (error) throw error;
  return data;
}

export async function updateSkillMatrix(
  userId: string,
  skillId: string,
  proficiencyLevel: 'none' | 'medium' | 'high'
) {
  const { data, error } = await supabase
    .from('skills_matrix')
    .upsert({
      user_id: userId,
      skill_id: skillId,
      proficiency_level: proficiencyLevel
    }, {
      onConflict: 'user_id,skill_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkUpdateSkillMatrix(
  updates: Array<{
    userId: string;
    skillId: string;
    proficiencyLevel: 'none' | 'medium' | 'high';
  }>
) {
  const { data, error } = await supabase
    .from('skills_matrix')
    .upsert(
      updates.map(update => ({
        user_id: update.userId,
        skill_id: update.skillId,
        proficiency_level: update.proficiencyLevel
      })),
      { onConflict: 'user_id,skill_id' }
    );

  if (error) throw error;
  return data;
}