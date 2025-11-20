-- 학습일지 테이블 생성 (빠른 수정용)
-- Supabase SQL Editor에서 이 파일의 내용을 실행하세요

-- updated_at 자동 업데이트 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
DROP TRIGGER IF EXISTS update_learning_logs_updated_at ON learning_logs;
CREATE TRIGGER update_learning_logs_updated_at 
  BEFORE UPDATE ON learning_logs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE learning_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON learning_logs;
CREATE POLICY "Allow all operations for authenticated users" ON learning_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 테이블 생성 확인
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'learning_logs'
ORDER BY ordinal_position;

