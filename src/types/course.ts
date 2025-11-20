export interface CourseSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Course {
  id: string;
  name: string;
  subject: string;
  instructor_id: string;
  instructor_name?: string;
  day_of_week: number; // 하위 호환성을 위해 유지
  start_time: string; // 하위 호환성을 위해 유지
  end_time: string; // 하위 호환성을 위해 유지
  schedule?: CourseSchedule[]; // 새로운 스케줄 필드
  capacity: number;
  enrolled_count?: number;
  tuition_fee: number;
  created_at: string;
  updated_at: string;
}

export interface CourseFormData {
  name: string;
  subject: string;
  instructor_id: string;
  schedule: CourseSchedule[]; // 여러 요일 선택 가능
  capacity: number;
  tuition_fee: number;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  student_name?: string;
  enrolled_at: string;
}

