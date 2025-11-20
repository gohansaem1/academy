-- 수강료 입금 테이블의 status 컬럼에 'confirmed' 상태 추가
-- 기존 CHECK 제약조건을 수정하여 'confirmed' 상태를 포함하도록 변경

-- 기존 제약조건 삭제
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- 새로운 제약조건 추가 (confirmed 포함)
ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('completed', 'pending', 'confirmed', 'cancelled'));

-- 기본값을 'pending'으로 변경 (선택사항)
ALTER TABLE payments 
ALTER COLUMN status SET DEFAULT 'pending';

