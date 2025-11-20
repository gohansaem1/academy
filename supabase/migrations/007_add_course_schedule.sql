-- 수업 일정 스케줄 기능 추가
-- 여러 요일 선택 및 요일별 시간 설정 지원

-- courses 테이블에 schedule JSON 필드 추가
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT NULL;

-- 기존 데이터 마이그레이션 (day_of_week, start_time, end_time을 schedule로 변환)
UPDATE courses
SET schedule = jsonb_build_array(
  jsonb_build_object(
    'day_of_week', day_of_week,
    'start_time', start_time,
    'end_time', end_time
  )
)
WHERE schedule IS NULL;

-- 인덱스 추가 (JSON 필드 검색용)
CREATE INDEX IF NOT EXISTS idx_courses_schedule ON courses USING GIN (schedule);

