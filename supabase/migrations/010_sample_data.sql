-- 가상 데이터 생성 스크립트
-- 기존 데이터 삭제 및 샘플 데이터 생성

-- 기존 데이터 삭제 (외래키 제약조건 때문에 순서 중요)
DELETE FROM learning_logs;
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM course_enrollments;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM instructors;

-- 강사 생성 (조이)
INSERT INTO instructors (id, name, phone, email, subject, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '조이',
  '010-0000-0001',
  'joy@funbility.com',
  '영어미술',
  NOW(),
  NOW()
);

-- 학생 40명 생성
INSERT INTO students (id, name, phone, email, address, guardian_name, guardian_phone, payment_due_day, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '김민수', '010-1001-0001', 'student01@example.com', '서울시 강남구', '김부모', '010-2001-0001', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', '이지은', '010-1002-0002', 'student02@example.com', '서울시 강남구', '이부모', '010-2002-0002', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', '박준호', '010-1003-0003', 'student03@example.com', '서울시 서초구', '박부모', '010-2003-0003', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', '최수진', '010-1004-0004', 'student04@example.com', '서울시 서초구', '최부모', '010-2004-0004', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', '정다은', '010-1005-0005', 'student05@example.com', '서울시 송파구', '정부모', '010-2005-0005', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', '강민준', '010-1006-0006', 'student06@example.com', '서울시 송파구', '강부모', '010-2006-0006', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', '윤서연', '010-1007-0007', 'student07@example.com', '서울시 강동구', '윤부모', '010-2007-0007', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000008', '장현우', '010-1008-0008', 'student08@example.com', '서울시 강동구', '장부모', '010-2008-0008', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000009', '임하늘', '010-1009-0009', 'student09@example.com', '서울시 강서구', '임부모', '010-2009-0009', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000010', '한소희', '010-1010-0010', 'student10@example.com', '서울시 강서구', '한부모', '010-2010-0010', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000011', '오지훈', '010-1011-0011', 'student11@example.com', '서울시 마포구', '오부모', '010-2011-0011', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000012', '신예린', '010-1012-0012', 'student12@example.com', '서울시 마포구', '신부모', '010-2012-0012', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000013', '류도현', '010-1013-0013', 'student13@example.com', '서울시 영등포구', '류부모', '010-2013-0013', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000014', '문채원', '010-1014-0014', 'student14@example.com', '서울시 영등포구', '문부모', '010-2014-0014', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000015', '배성민', '010-1015-0015', 'student15@example.com', '서울시 양천구', '배부모', '010-2015-0015', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000016', '송지아', '010-1016-0016', 'student16@example.com', '서울시 양천구', '송부모', '010-2016-0016', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000017', '유태영', '010-1017-0017', 'student17@example.com', '서울시 구로구', '유부모', '010-2017-0017', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000018', '조민서', '010-1018-0018', 'student18@example.com', '서울시 구로구', '조부모', '010-2018-0018', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000019', '허준혁', '010-1019-0019', 'student19@example.com', '서울시 금천구', '허부모', '010-2019-0019', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000020', '곽나연', '010-1020-0020', 'student20@example.com', '서울시 금천구', '곽부모', '010-2020-0020', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000021', '남동욱', '010-1021-0021', 'student21@example.com', '서울시 관악구', '남부모', '010-2021-0021', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000022', '노서윤', '010-1022-0022', 'student22@example.com', '서울시 관악구', '노부모', '010-2022-0022', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000023', '도현석', '010-1023-0023', 'student23@example.com', '서울시 동작구', '도부모', '010-2023-0023', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000024', '라미래', '010-1024-0024', 'student24@example.com', '서울시 동작구', '라부모', '010-2024-0024', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000025', '마준영', '010-1025-0025', 'student25@example.com', '서울시 서대문구', '마부모', '010-2025-0025', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000026', '백하은', '010-1026-0026', 'student26@example.com', '서울시 서대문구', '백부모', '010-2026-0026', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000027', '사건우', '010-1027-0027', 'student27@example.com', '서울시 중구', '사부모', '010-2027-0027', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000028', '아지수', '010-1028-0028', 'student28@example.com', '서울시 중구', '아부모', '010-2028-0028', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000029', '자민규', '010-1029-0029', 'student29@example.com', '서울시 종로구', '자부모', '010-2029-0029', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000030', '차예나', '010-1030-0030', 'student30@example.com', '서울시 종로구', '차부모', '010-2030-0030', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000031', '카준서', '010-1031-0031', 'student31@example.com', '서울시 용산구', '카부모', '010-2031-0031', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000032', '타서아', '010-1032-0032', 'student32@example.com', '서울시 용산구', '타부모', '010-2032-0032', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000033', '파도윤', '010-1033-0033', 'student33@example.com', '서울시 성동구', '파부모', '010-2033-0033', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000034', '하나린', '010-1034-0034', 'student34@example.com', '서울시 성동구', '하부모', '010-2034-0034', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000035', '거민혁', '010-1035-0035', 'student35@example.com', '서울시 광진구', '거부모', '010-2035-0035', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000036', '너서진', '010-1036-0036', 'student36@example.com', '서울시 광진구', '너부모', '010-2036-0036', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000037', '더현진', '010-1037-0037', 'student37@example.com', '서울시 성북구', '더부모', '010-2037-0037', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000038', '러지원', '010-1038-0038', 'student38@example.com', '서울시 성북구', '러부모', '010-2038-0038', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000039', '머준아', '010-1039-0039', 'student39@example.com', '서울시 노원구', '머부모', '010-2039-0039', 25, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000040', '버서율', '010-1040-0040', 'student40@example.com', '서울시 노원구', '버부모', '010-2040-0040', 25, NOW(), NOW());

-- 수업 생성
-- 화목토 과정 3개 (화요일=2, 목요일=4, 토요일=6)
-- 기존 컬럼들(day_of_week, start_time, end_time)도 채워줌 (하위 호환성)
INSERT INTO courses (id, name, subject, instructor_id, day_of_week, start_time, end_time, schedule, capacity, tuition_fee, created_at, updated_at)
VALUES
  -- 화목토 과정 1 (첫 번째 스케줄을 기존 컬럼에 사용)
  ('20000000-0000-0000-0000-000000000001', '화목토 영어 기초반', '영어', '00000000-0000-0000-0000-000000000001',
   2, '14:00', '15:30',
   '[{"day_of_week": 2, "start_time": "14:00", "end_time": "15:30"}, {"day_of_week": 4, "start_time": "14:00", "end_time": "15:30"}, {"day_of_week": 6, "start_time": "10:00", "end_time": "11:30"}]'::jsonb,
   8, 150000, NOW(), NOW()),
  -- 화목토 과정 2
  ('20000000-0000-0000-0000-000000000002', '화목토 영어 중급반', '영어', '00000000-0000-0000-0000-000000000001',
   2, '16:00', '17:30',
   '[{"day_of_week": 2, "start_time": "16:00", "end_time": "17:30"}, {"day_of_week": 4, "start_time": "16:00", "end_time": "17:30"}, {"day_of_week": 6, "start_time": "13:00", "end_time": "14:30"}]'::jsonb,
   8, 180000, NOW(), NOW()),
  -- 화목토 과정 3
  ('20000000-0000-0000-0000-000000000003', '화목토 미술 창의반', '미술', '00000000-0000-0000-0000-000000000001',
   2, '18:00', '19:30',
   '[{"day_of_week": 2, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 4, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 6, "start_time": "15:00", "end_time": "16:30"}]'::jsonb,
   8, 200000, NOW(), NOW()),
  -- 월수금 과정 1
  ('20000000-0000-0000-0000-000000000004', '월수금 영어 기초반', '영어', '00000000-0000-0000-0000-000000000001',
   1, '14:00', '15:30',
   '[{"day_of_week": 1, "start_time": "14:00", "end_time": "15:30"}, {"day_of_week": 3, "start_time": "14:00", "end_time": "15:30"}, {"day_of_week": 5, "start_time": "14:00", "end_time": "15:30"}]'::jsonb,
   8, 150000, NOW(), NOW()),
  -- 월수금 과정 2
  ('20000000-0000-0000-0000-000000000005', '월수금 영어 중급반', '영어', '00000000-0000-0000-0000-000000000001',
   1, '16:00', '17:30',
   '[{"day_of_week": 1, "start_time": "16:00", "end_time": "17:30"}, {"day_of_week": 3, "start_time": "16:00", "end_time": "17:30"}, {"day_of_week": 5, "start_time": "16:00", "end_time": "17:30"}]'::jsonb,
   8, 180000, NOW(), NOW()),
  -- 월수금 과정 3
  ('20000000-0000-0000-0000-000000000006', '월수금 미술 창의반', '미술', '00000000-0000-0000-0000-000000000001',
   1, '18:00', '19:30',
   '[{"day_of_week": 1, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 3, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 5, "start_time": "18:00", "end_time": "19:30"}]'::jsonb,
   8, 200000, NOW(), NOW());

-- 학생 등록 (각 수업에 8명씩 등록)
-- 화목토 영어 기초반 (학생 1-8)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', NOW()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', NOW());

-- 화목토 영어 중급반 (학생 9-16)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000010', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000014', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000015', NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000016', NOW());

-- 화목토 미술 창의반 (학생 17-24)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000017', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000020', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000021', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000022', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000023', NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000024', NOW());

-- 월수금 영어 기초반 (학생 25-32)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000025', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000026', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000027', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000028', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000029', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000030', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000031', NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000032', NOW());

-- 월수금 영어 중급반 (학생 33-40)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000033', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000034', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000035', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000036', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000037', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000038', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000039', NOW()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000040', NOW());

-- 월수금 미술 창의반 (학생 1-8, 일부 중복 등록)
INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
VALUES
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000008', NOW());

-- 결제 데이터 생성 (각 학생이 등록한 수업에 대해 결제 항목 생성)
-- 이번 달 결제일 기준으로 생성
DO $$
DECLARE
  enrollment_record RECORD;
  student_record RECORD;
  course_record RECORD;
  payment_date DATE;
  due_day INTEGER;
BEGIN
  FOR enrollment_record IN SELECT * FROM course_enrollments LOOP
    -- 학생 정보 조회
    SELECT payment_due_day INTO due_day FROM students WHERE id = enrollment_record.student_id;
    IF due_day IS NULL THEN
      due_day := 25;
    END IF;
    
    -- 수업 정보 조회
    SELECT tuition_fee INTO course_record FROM courses WHERE id = enrollment_record.course_id;
    
    -- 결제일 계산 (이번 달 결제일)
    payment_date := DATE_TRUNC('month', CURRENT_DATE) + (due_day - 1) * INTERVAL '1 day';
    IF payment_date < CURRENT_DATE THEN
      payment_date := payment_date + INTERVAL '1 month';
    END IF;
    
    -- 결제 항목 생성
    INSERT INTO payments (student_id, course_id, amount, payment_method, payment_date, status, created_at)
    VALUES (
      enrollment_record.student_id,
      enrollment_record.course_id,
      course_record.tuition_fee,
      'card',
      payment_date,
      CASE WHEN RANDOM() < 0.7 THEN 'confirmed' ELSE 'pending' END,
      NOW()
    );
  END LOOP;
END $$;

-- 한 달치 출석 데이터 생성
-- 현재 달의 각 수업 스케줄에 맞춰 출석 데이터 생성
DO $$
DECLARE
  course_record RECORD;
  schedule_item JSONB;
  student_record RECORD;
  class_date DATE;
  current_month_start DATE;
  current_month_end DATE;
  day_of_week INTEGER;
  status_options TEXT[] := ARRAY['present', 'late', 'early', 'absent'];
  status_weights INTEGER[] := ARRAY[7, 1, 1, 1]; -- 출석 70%, 지각 10%, 조퇴 10%, 결석 10%
  selected_status TEXT;
  random_val NUMERIC;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- 각 수업에 대해
  FOR course_record IN SELECT * FROM courses LOOP
    -- 각 학생에 대해
    FOR student_record IN 
      SELECT s.* FROM students s
      INNER JOIN course_enrollments ce ON s.id = ce.student_id
      WHERE ce.course_id = course_record.id
    LOOP
      -- 수업 스케줄에 따라 출석 데이터 생성
      FOR schedule_item IN SELECT * FROM jsonb_array_elements(course_record.schedule) LOOP
        day_of_week := (schedule_item->>'day_of_week')::INTEGER;
        
        -- 이번 달의 해당 요일 찾기
        class_date := current_month_start;
        WHILE class_date <= current_month_end LOOP
          -- 해당 요일인지 확인 (0=일요일, 6=토요일)
          IF EXTRACT(DOW FROM class_date) = day_of_week THEN
            -- 랜덤하게 출석 상태 결정
            random_val := RANDOM();
            IF random_val < 0.7 THEN
              selected_status := 'present';
            ELSIF random_val < 0.8 THEN
              selected_status := 'late';
            ELSIF random_val < 0.9 THEN
              selected_status := 'early';
            ELSE
              selected_status := 'absent';
            END IF;
            
            -- 출석 데이터 삽입
            INSERT INTO attendance (course_id, student_id, date, status, created_at)
            VALUES (
              course_record.id,
              student_record.id,
              class_date,
              selected_status,
              NOW()
            )
            ON CONFLICT (course_id, student_id, date) DO NOTHING;
          END IF;
          
          class_date := class_date + INTERVAL '1 day';
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- 한 달치 학습일지 생성
DO $$
DECLARE
  course_record RECORD;
  schedule_item JSONB;
  class_date DATE;
  current_month_start DATE;
  current_month_end DATE;
  day_of_week INTEGER;
  log_content TEXT;
  homework_content TEXT;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- 각 수업에 대해
  FOR course_record IN SELECT * FROM courses LOOP
    -- 수업 스케줄에 따라 학습일지 생성
    FOR schedule_item IN SELECT * FROM jsonb_array_elements(course_record.schedule) LOOP
      day_of_week := (schedule_item->>'day_of_week')::INTEGER;
      
      -- 이번 달의 해당 요일 찾기
      class_date := current_month_start;
      WHILE class_date <= current_month_end LOOP
        -- 해당 요일인지 확인
        IF EXTRACT(DOW FROM class_date) = day_of_week THEN
          -- 학습일지 내용 생성
          log_content := course_record.name || ' 수업이 진행되었습니다. ' || 
                         CASE course_record.subject 
                           WHEN '영어' THEN '영어 단어와 문법을 학습하고 회화 연습을 진행했습니다.'
                           WHEN '미술' THEN '창의적인 미술 활동을 통해 표현력을 기르는 시간이었습니다.'
                           ELSE '수업이 진행되었습니다.'
                         END;
          
          homework_content := CASE course_record.subject
            WHEN '영어' THEN '다음 수업까지 단어 암기 및 문법 연습 문제 풀이'
            WHEN '미술' THEN '다음 수업 준비물: 색연필, 스케치북'
            ELSE '과제 없음'
          END;
          
          -- 학습일지 삽입
          INSERT INTO learning_logs (course_id, date, content, homework, notes, instructor_id, created_at, updated_at)
          VALUES (
            course_record.id,
            class_date,
            log_content,
            homework_content,
            '수업 진행 상황 양호',
            course_record.instructor_id,
            NOW(),
            NOW()
          )
          ON CONFLICT (course_id, date) DO NOTHING;
        END IF;
        
        class_date := class_date + INTERVAL '1 day';
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

