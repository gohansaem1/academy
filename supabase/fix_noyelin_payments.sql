-- 노예린 학생의 수강료 항목 확인 및 생성

-- 1. 노예린 학생 정보 확인
SELECT id, name, status, first_class_date, last_class_date, payment_due_day
FROM students
WHERE name = '노예린';

-- 2. 노예린 학생이 수강 중인 수업 확인
SELECT 
  s.name as student_name,
  s.status,
  c.name as course_name,
  c.tuition_fee,
  ce.enrolled_at
FROM course_enrollments ce
INNER JOIN students s ON ce.student_id = s.id
INNER JOIN courses c ON ce.course_id = c.id
WHERE s.name = '노예린';

-- 3. 노예린 학생의 모든 결제/환불 항목 확인
SELECT 
  s.name as student_name,
  c.name as course_name,
  p.amount,
  p.payment_date,
  p.type,
  p.status,
  p.payment_method,
  p.created_at
FROM payments p
INNER JOIN students s ON p.student_id = s.id
INNER JOIN courses c ON p.course_id = c.id
WHERE s.name = '노예린'
ORDER BY p.payment_date DESC, p.created_at DESC;

-- 4. 노예린 학생을 수업에 등록하고 결제 항목 생성
DO $$
DECLARE
  noyelin_id UUID;
  course_record RECORD;
  first_class_date_val DATE := '2025-09-09'::DATE;
  last_class_date_val DATE := '2025-09-27'::DATE;
  payment_due_day_val INTEGER := 25;
  enrollment_date DATE;
  current_month_start DATE;
  current_month_end DATE;
  payment_date DATE;
  tuition_fee_val INTEGER;
  days_in_month INTEGER;
  days_remaining INTEGER;
  first_month_amount INTEGER;
  next_month_amount INTEGER;
  refund_amount INTEGER;
  days_in_last_month INTEGER;
  days_attended INTEGER;
BEGIN
  -- 노예린 학생 ID 찾기
  SELECT id INTO noyelin_id
  FROM students
  WHERE name = '노예린';
  
  IF noyelin_id IS NULL THEN
    RAISE EXCEPTION '노예린 학생을 찾을 수 없습니다.';
  END IF;
  
  -- 첫 번째 수업에 등록 (랜덤하게 선택)
  SELECT id, tuition_fee INTO course_record
  FROM courses
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF course_record.id IS NULL THEN
    RAISE EXCEPTION '등록할 수업을 찾을 수 없습니다.';
  END IF;
  
  -- 수업 등록 (이미 등록되어 있으면 무시)
  INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
  VALUES (course_record.id, noyelin_id, first_class_date_val)
  ON CONFLICT (course_id, student_id) DO NOTHING;
  
  tuition_fee_val := course_record.tuition_fee;
  
  -- 첫 달 수강료 계산 (9월 9일 ~ 9월 30일)
  current_month_start := DATE_TRUNC('month', first_class_date_val);
  current_month_end := (DATE_TRUNC('month', first_class_date_val) + INTERVAL '1 month - 1 day')::DATE;
  days_in_month := EXTRACT(DAY FROM current_month_end)::INTEGER;
  days_remaining := (current_month_end - first_class_date_val + 1)::INTEGER;
  first_month_amount := (tuition_fee_val * days_remaining / days_in_month)::INTEGER;
  
  -- 다음 달 전체 수강료
  next_month_amount := tuition_fee_val;
  
  -- 첫 달 + 다음 달 합산 결제 항목 생성 (9월 25일)
  payment_date := DATE_TRUNC('month', first_class_date_val)::DATE + (payment_due_day_val - 1) * INTERVAL '1 day';
  IF payment_date < first_class_date_val THEN
    payment_date := first_class_date_val;
  END IF;
  
  INSERT INTO payments (
    student_id,
    course_id,
    amount,
    payment_method,
    payment_date,
    type,
    status,
    created_at
  )
  VALUES (
    noyelin_id,
    course_record.id,
    first_month_amount + next_month_amount,
    'card',
    payment_date,
    'payment',
    'pending',
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  -- 환불 금액 계산 (9월 27일 이후 3일분 환불)
  current_month_start := DATE_TRUNC('month', last_class_date_val);
  current_month_end := (DATE_TRUNC('month', last_class_date_val) + INTERVAL '1 month - 1 day')::DATE;
  days_in_last_month := EXTRACT(DAY FROM current_month_end)::INTEGER;
  days_attended := EXTRACT(DAY FROM last_class_date_val)::INTEGER;
  refund_amount := (tuition_fee_val * (days_in_last_month - days_attended) / days_in_last_month)::INTEGER;
  
  -- 환불 항목 생성 (9월 25일)
  payment_date := DATE_TRUNC('month', last_class_date_val)::DATE + (payment_due_day_val - 1) * INTERVAL '1 day';
  
  INSERT INTO payments (
    student_id,
    course_id,
    amount,
    payment_method,
    payment_date,
    type,
    status,
    created_at
  )
  VALUES (
    noyelin_id,
    course_record.id,
    -refund_amount,
    'card',
    payment_date,
    'refund',
    'pending',
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '노예린 학생의 결제 항목이 생성되었습니다.';
END $$;

-- 5. 생성 후 확인
SELECT 
  s.name as student_name,
  c.name as course_name,
  p.amount,
  p.payment_date,
  p.type,
  p.status,
  p.payment_method,
  p.created_at
FROM payments p
INNER JOIN students s ON p.student_id = s.id
INNER JOIN courses c ON p.course_id = c.id
WHERE s.name = '노예린'
ORDER BY p.payment_date DESC, p.created_at DESC;

