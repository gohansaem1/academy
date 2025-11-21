-- 노예린 학생의 수강료 항목 확인

-- 1. 노예린 학생 정보 확인
SELECT id, name, status, first_class_date, last_class_date, payment_due_day
FROM students
WHERE name = '노예린';

-- 2. 노예린 학생이 수강 중인 수업 확인
SELECT 
  s.name as student_name,
  c.name as course_name,
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

-- 4. 노예린 학생의 결제 항목 수 (타입별)
SELECT 
  p.type,
  COUNT(*) as count,
  SUM(ABS(p.amount)) as total_amount
FROM payments p
INNER JOIN students s ON p.student_id = s.id
WHERE s.name = '노예린'
GROUP BY p.type;

