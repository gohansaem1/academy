export interface User {
  id: string;
  name: string;
  role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ParentChild {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
}

