export interface Payment {
  id: string;
  student_id: string;
  course_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  payment_date: string;
  status: 'completed' | 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  student_name?: string;
  course_name?: string;
}

export interface PaymentFormData {
  student_id: string;
  course_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  payment_date: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

