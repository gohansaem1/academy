-- learning_logs 테이블에 학생별 코멘트 필드 추가
ALTER TABLE learning_logs ADD COLUMN IF NOT EXISTS student_comments JSONB DEFAULT '{}'::jsonb;

-- 인덱스 생성 (JSONB 필드 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_learning_logs_student_comments ON learning_logs USING GIN (student_comments);

