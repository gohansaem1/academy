-- 환불 테이블에 결제 방법과 결제일 컬럼 추가
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'card' CHECK (payment_method IN ('card', 'cash', 'transfer')),
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- 기존 데이터의 payment_date를 last_class_date로 설정
UPDATE refunds 
SET payment_date = last_class_date 
WHERE payment_date IS NULL;

-- payment_date를 NOT NULL로 변경
ALTER TABLE refunds 
ALTER COLUMN payment_date SET NOT NULL;

