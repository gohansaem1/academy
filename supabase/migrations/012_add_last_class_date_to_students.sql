-- students 테이블에 last_class_date 필드 추가
ALTER TABLE students
ADD COLUMN IF NOT EXISTS last_class_date DATE;

-- 인덱스 추가 (필요시)
CREATE INDEX IF NOT EXISTS idx_students_last_class_date ON students(last_class_date);

