export interface User {
  id: string;
  email: string;
  google_id?: string | null;
  full_name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  notes?: string;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  user_id: string;
  subject_id: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
  title: string;
  description: string;
  event_date: string;
  days_remaining: number;
  is_overdue: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
  title: string;
  description: string;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface SubjectDetailResponse {
  subject: Subject;
  dates: ImportantDate[];
  tasks: Task[];
  links: Link[];
}
