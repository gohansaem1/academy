-- 김하늘 학생의 실제 데이터 확인

-- 1. 김하늘 학생 기본 정보
SELECT 
  id,
  name,
  status,
  first_class_date,
  last_class_date,
  payment_due_day,
  created_at
FROM students
WHERE name = '김하늘';

-- 2. 김하늘 학생이 수강 중인 수업
SELECT 
  s.name as student_name,
  c.name as course_name,
  c.tuition_fee,
  ce.enrolled_at
FROM course_enrollments ce
INNER JOIN students s ON ce.student_id = s.id
INNER JOIN courses c ON ce.course_id = c.id
WHERE s.name = '김하늘';

-- 3. 김하늘 학생의 모든 결제/환불 항목
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
WHERE s.name = '김하늘'
ORDER BY p.payment_date ASC, p.created_at ASC;

-- 4. 김하늘 학생의 결제/환불 통계
SELECT 
  p.type,
  COUNT(*) as count,
  SUM(ABS(p.amount)) as total_amount,
  SUM(CASE WHEN p.status = 'confirmed' THEN ABS(p.amount) ELSE 0 END) as confirmed_amount,
  SUM(CASE WHEN p.status = 'pending' THEN ABS(p.amount) ELSE 0 END) as pending_amount
FROM payments p
INNER JOIN students s ON p.student_id = s.id
WHERE s.name = '김하늘'
GROUP BY p.type;

