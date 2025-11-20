-- students 테이블에 매월 결제일 필드 추가
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_due_day INTEGER CHECK (payment_due_day >= 1 AND payment_due_day <= 31);

