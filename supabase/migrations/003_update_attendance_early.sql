-- 출석 테이블에 조퇴(early) 상태 추가
-- 기존 CHECK 제약조건을 수정하여 'early' 상태를 포함하도록 변경

-- 기존 제약조건 삭제
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

-- 새로운 제약조건 추가 (early 포함)
ALTER TABLE attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'late', 'absent', 'early'));

