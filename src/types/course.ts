export interface Course {
  id: string;
  name: string;
  subject: string;
  instructor_id: string;
  instructor_name?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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
  day_of_week: number;
  start_time: string;
  end_time: string;
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

