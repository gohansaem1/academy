export interface Instructor {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorFormData {
  name: string;
  phone: string;
  email?: string;
  subject: string;
}

