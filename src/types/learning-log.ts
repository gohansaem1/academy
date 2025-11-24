export interface LearningLog {
  id: string;
  course_id: string;
  date: string;
  content: string;
  homework?: string | null;
  notes?: string | null;
  instructor_id: string;
  student_comments?: Record<string, string> | null; // 학생 ID를 키로 하는 코멘트 객체
  created_at: string;
  updated_at: string;
  course_name?: string;
  course_subject?: string;
  instructor_name?: string;
}

export interface LearningLogFormData {
  course_id: string;
  date: string;
  content: string;
  homework?: string;
  notes?: string;
  student_comments?: Record<string, string>; // 학생 ID를 키로 하는 코멘트 객체
}

