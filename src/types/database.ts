/**
 * Supabase 데이터베이스 타입 정의
 * 
 * Supabase Studio에서 생성한 테이블에 맞춰 타입을 정의합니다.
 * 자동 생성된 타입을 사용하려면 Supabase CLI를 사용하세요:
 * npx supabase gen types typescript --project-id krcncyrwiirgfvzsqpjy > src/types/database.ts
 */

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          guardian_name: string;
          guardian_phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          guardian_name: string;
          guardian_phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          guardian_name?: string;
          guardian_phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      instructors: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          subject: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          subject: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          subject?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          subject: string;
          instructor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          capacity: number;
          tuition_fee: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          instructor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          capacity: number;
          tuition_fee: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          instructor_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          tuition_fee?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          enrolled_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          date: string;
          status: 'present' | 'late' | 'absent';
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          date: string;
          status: 'present' | 'late' | 'absent';
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          date?: string;
          status?: 'present' | 'late' | 'absent';
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          payment_date: string;
          status: 'completed' | 'pending' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          payment_date: string;
          status?: 'completed' | 'pending' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          amount?: number;
          payment_method?: 'cash' | 'card' | 'transfer';
          payment_date?: string;
          status?: 'completed' | 'pending' | 'cancelled';
          created_at?: string;
        };
      };
    };
  };
}

