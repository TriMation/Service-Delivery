import { User } from './database';

export interface AuthUser extends User {
  isAdmin: boolean;
  isClient: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user' | 'client';
  company_id?: string;
}

export interface SignInData {
  email: string;
  password: string;
}