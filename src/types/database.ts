export type UserRole = 'admin' | 'user' | 'client';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type RequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface SystemSettings {
  id: string;
  organization_name: string;
  logo_url: string | null;
  primary_color: string;
  password_min_length: number;
  session_timeout: number;
  two_factor_enabled: boolean;
  pdf_header_image: string | null;
  pdf_title_format: string;
  pdf_font_family: string;
  pdf_font_size_body: number;
  pdf_font_size_header: number;
  pdf_margin_top: number;
  pdf_margin_bottom: number;
  pdf_margin_left: number;
  pdf_margin_right: number;
  pdf_footer_text: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  title: string | null;
  role: UserRole;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  company_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  allocated_hours: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  start_date: string | null;
  end_date: string | null;
  task_number: string | null;
  task_order: number;
  parent_task_id: string | null;
  dependency_task_id: string | null;
  estimated_hours: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  user_id: string;
  hours: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  project_id: string | null;
  title: string;
  description: string;
  status: RequestStatus;
  submitted_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceMatrix {
  id: string;
  user_id: string;
  cost: number;
  time_loading: number;
  cost_loading: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SkillMatrix {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: 'none' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user?: User;
  skill?: Skill;
}