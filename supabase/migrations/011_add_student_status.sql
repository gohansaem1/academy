-- students 테이블에 status 필드 추가
ALTER TABLE students
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' 
  CHECK (status IN ('active', 'inactive'));

-- 기존 데이터는 모두 'active'로 설정 (이미 DEFAULT로 처리됨)

-- 인덱스 추가 (status로 필터링하는 경우가 많을 것으로 예상)
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

