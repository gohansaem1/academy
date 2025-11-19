export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  guardian_name: string;
  guardian_phone: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  guardian_name: string;
  guardian_phone: string;
}

