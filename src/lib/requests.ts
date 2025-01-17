import { supabase } from './supabase';
import type { Request } from '../types/database';

export async function getRequests(userId: string, isAdmin: boolean) {
  let query = supabase
    .from('requests')
    .select(`
      *,
      project:projects(
        id,
        name,
        company:companies(id, name)
      ),
      submitter:users!requests_submitted_by_fkey(
        id,
        full_name,
        email,
        role
      ),
      assignee:users!requests_assigned_to_fkey(
        id,
        full_name,
        email
      ),
      comments:request_comments(
        id,
        content,
        created_at,
        user:users(id, full_name)
      ),
      upvotes:request_upvotes(
        id,
        user_id
      )
    `);

  // If not admin, only show relevant requests
  if (!isAdmin) {
    query = query.or(`submitted_by.eq.${userId},project.company_id.eq.${userId}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRequest(request: Partial<Request>) {
  const { data, error } = await supabase
    .from('requests')
    .insert(request)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRequest(id: string, updates: Partial<Request>) {
  const { data, error } = await supabase
    .from('requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addComment(requestId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('request_comments')
    .insert({
      request_id: requestId,
      user_id: userId,
      content
    })
    .select(`
      id,
      content,
      created_at,
      user:users(id, full_name)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function toggleUpvote(requestId: string, userId: string) {
  // Check if upvote exists
  const { data: existing } = await supabase
    .from('request_upvotes')
    .select('id')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Remove upvote
    const { error } = await supabase
      .from('request_upvotes')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false;
  } else {
    // Add upvote
    const { error } = await supabase
      .from('request_upvotes')
      .insert({
        request_id: requestId,
        user_id: userId
      });

    if (error) throw error;
    return true;
  }
}