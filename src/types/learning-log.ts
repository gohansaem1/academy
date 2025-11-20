export interface LearningLog {
  id: string;
  course_id: string;
  date: string;
  content: string;
  homework?: string | null;
  notes?: string | null;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  course_name?: string;
  instructor_name?: string;
}

export interface LearningLogFormData {
  course_id: string;
  date: string;
  content: string;
  homework?: string;
  notes?: string;
}

