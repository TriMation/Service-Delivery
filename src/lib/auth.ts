import { supabase } from './supabase';
import type { AuthUser, SignUpData, SignInData } from '../types/auth';
import type { User } from '../types/database';

export async function signUp({ email, password, full_name, role, company_id }: SignUpData) {
  // Step 1: Validate input
  if (!email || !password || !full_name || !role) {
    throw new Error('Missing required fields');
  }

  // Step 2: Check if user already exists in auth.users
  const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
  const existingUser = users?.find(u => u.email === email);

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Step 3: Create the auth user with metadata
  const { data: auth, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        company_id,
        created_at: new Date().toISOString()
      }
    }
  });

  if (authError) throw authError;
  if (!auth.user) throw new Error('Failed to create user');

  // Step 4: Create the user profile
  try {
    const { error: profileError } = await supabase.from('users').insert({
      id: auth.user.id,
      email,
      full_name,
      role,
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(auth.user.id);
      throw profileError;
    }
  } catch (error) {
    // If anything fails during profile creation, clean up the auth user
    await supabase.auth.admin.deleteUser(auth.user.id);
    throw error;
  }

  return auth;
}

export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error('Invalid email or password');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  return {
    ...profile,
    isAdmin: profile.role === 'admin',
    isClient: profile.role === 'client',
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    isAdmin: profile.role === 'admin',
    isClient: profile.role === 'client',
  };
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resetUserPassword(userId: string, newPassword: string) {
  // Add delay to ensure database is ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error } = await supabase.rpc('admin_reset_password', {
    user_id: userId,
    new_password: newPassword
  });

  if (error) {
    console.error('Password reset error:', error);
    throw new Error('Failed to reset password. Please ensure you have admin privileges.');
  }
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*, companies(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createUser(userData: SignUpData) {
  return signUp(userData);
}

export async function inviteClient(email: string, fullName: string, companyId: string) {
  const password = generateTempPassword();

  // Step 1: Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Step 2: Validate input
  if (!email || !fullName || !companyId) {
    throw new Error('Missing required fields');
  }

  // Step 3: Create the auth user with metadata
  const { data: auth, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'client',
        company_id: companyId,
        created_at: new Date().toISOString()
      }
    }
  });

  if (authError) throw authError;
  if (!auth.user) throw new Error('Failed to create user');

  // Step 4: Create the user profile
  try {
    const { error: profileError } = await supabase.from('users').insert({
      id: auth.user.id,
      email,
      full_name: fullName,
      role: 'client',
      company_id: companyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(auth.user.id);
      throw profileError;
    }
  } catch (error) {
    // If anything fails during profile creation, clean up the auth user
    try {
      await supabase.auth.admin.deleteUser(auth.user.id);
    } catch (deleteError) {
      console.error('Failed to cleanup auth user after profile creation error:', deleteError);
    }
    throw error;
  }

  return { user: auth.user, password };
}

function generateTempPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}