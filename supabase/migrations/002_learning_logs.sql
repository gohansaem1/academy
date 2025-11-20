-- 학습일지 테이블 생성
CREATE TABLE IF NOT EXISTS learning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  homework TEXT,
  notes TEXT,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_learning_logs_course_id ON learning_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_date ON learning_logs(date);
CREATE INDEX IF NOT EXISTS idx_learning_logs_instructor_id ON learning_logs(instructor_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_learning_logs_updated_at 
  BEFORE UPDATE ON learning_logs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE learning_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON learning_logs;
CREATE POLICY "Allow all operations for authenticated users" ON learning_logs
  FOR ALL USING (true) WITH CHECK (true);

