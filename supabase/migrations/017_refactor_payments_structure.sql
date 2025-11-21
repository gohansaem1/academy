-- 수강료 관리 구조 개선
-- payments 테이블에 type 필드 추가하여 결제와 환불을 통합 관리

-- 1. payments 테이블에 type 필드 추가
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'payment' CHECK (type IN ('payment', 'refund'));

-- 2. 기존 데이터는 모두 'payment'로 설정
UPDATE payments SET type = 'payment' WHERE type IS NULL;

-- 3. type을 NOT NULL로 변경
ALTER TABLE payments 
ALTER COLUMN type SET NOT NULL;

-- 4. status를 단순화: 'pending' (미납/미지급), 'confirmed' (입금확인/환불확인)
-- 기존 'completed'는 'confirmed'로 변경
UPDATE payments SET status = 'confirmed' WHERE status = 'completed';

-- 5. status CHECK 제약조건 수정
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled'));

-- 6. refunds 테이블의 데이터를 payments 테이블로 마이그레이션
-- (refunds 테이블이 있는 경우)
DO $$
DECLARE
  refund_record RECORD;
BEGIN
  -- refunds 테이블이 존재하는지 확인
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refunds') THEN
    FOR refund_record IN 
      SELECT * FROM refunds
    LOOP
      -- 환불을 payments 테이블에 음수 금액으로 삽입
      INSERT INTO payments (
        student_id,
        course_id,
        amount,
        payment_method,
        payment_date,
        status,
        type,
        created_at
      )
      VALUES (
        refund_record.student_id,
        refund_record.course_id,
        refund_record.amount,
        COALESCE(refund_record.payment_method, 'card'),
        refund_record.payment_date,
        refund_record.status,
        'refund',
        refund_record.created_at
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_type_status ON payments(type, status);

-- 8. payments 테이블의 amount CHECK 제약조건 제거 (음수 허용을 위해)
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_amount_check;

-- 9. 새로운 CHECK 제약조건 추가 (양수만 허용, 화면에서 환불은 음수로 표시)
-- 실제로는 amount를 절댓값으로 저장하고 type으로 구분하는 것이 더 나음
-- 하지만 사용자 요구사항에 따라 음수도 허용할 수 있도록 주석 처리
-- ALTER TABLE payments 
-- ADD CONSTRAINT payments_amount_check CHECK (amount != 0);

