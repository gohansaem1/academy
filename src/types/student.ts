export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  guardian_name: string;
  guardian_phone: string;
  payment_due_day?: number | null; // 매월 결제일 (1-31)
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
  payment_due_day?: number; // 매월 결제일 (1-31)
}

