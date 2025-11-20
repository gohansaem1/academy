export interface Attendance {
  id: string;
  course_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'late' | 'absent' | 'early';
  created_at: string;
  course_name?: string;
  student_name?: string;
}

export interface AttendanceFormData {
  course_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'late' | 'absent' | 'early';
}

