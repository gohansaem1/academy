-- 환불 상태 저장 테이블 생성
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  last_class_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, last_class_date)
);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at 
  BEFORE UPDATE ON refunds
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_refunds_student_id ON refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_course_id ON refunds(course_id);
CREATE INDEX IF NOT EXISTS idx_refunds_last_class_date ON refunds(last_class_date);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- RLS 정책 (모든 사용자가 읽기/쓰기 가능)
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON refunds
  FOR ALL
  USING (true)
  WITH CHECK (true);

