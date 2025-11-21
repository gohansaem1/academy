export interface Payment {
  id: string;
  student_id: string;
  course_id: string;
  amount: number; // 양수: 결제, 음수: 환불
  payment_method: 'cash' | 'card' | 'transfer';
  payment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled'; // pending: 미납/미지급, confirmed: 입금확인/환불확인
  type: 'payment' | 'refund'; // payment: 수강료, refund: 환불
  created_at: string;
  student_name?: string;
  course_name?: string;
  // 환불 관련 필드 (refund 타입인 경우)
  last_class_date?: string | null;
  // 학생 관련 필드 (조회 시 조인)
  student_payment_due_day?: number | null;
  student_first_class_date?: string | null;
  student_last_class_date?: string | null;
  student_status?: string | null;
  course_tuition_fee?: number | null;
}

export interface PaymentFormData {
  student_id: string;
  course_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  payment_date: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  type?: 'payment' | 'refund';
  last_class_date?: string | null; // 환불인 경우
}

