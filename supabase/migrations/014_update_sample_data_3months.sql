-- 기존 데이터 삭제 (학습일지, 출석, 결제, 수업 등록, 학생, 강사, 수업)
DELETE FROM learning_logs;
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM course_enrollments;
DELETE FROM students;
DELETE FROM courses;
DELETE FROM instructors;

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 강사 1명 (Joy)
INSERT INTO instructors (id, name, phone, email, subject, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', '조이', '010-1234-5678', 'joy@academy.com', '영어', NOW(), NOW());

-- 수업 6개 생성 (화목토 3개, 월수금 3개)
-- 화목토 과정 3개 (화요일=2, 목요일=4, 토요일=6)
INSERT INTO courses (id, name, subject, instructor_id, day_of_week, start_time, end_time, schedule, capacity, tuition_fee, created_at, updated_at)
VALUES
  -- 화목토 과정 1
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
  ('20000000-0000-0000-0000-000000000003', '화목토 영어 고급반', '영어', '00000000-0000-0000-0000-000000000001',
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
  ('20000000-0000-0000-0000-000000000006', '월수금 영어 고급반', '영어', '00000000-0000-0000-0000-000000000001',
   1, '18:00', '19:30',
   '[{"day_of_week": 1, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 3, "start_time": "18:00", "end_time": "19:30"}, {"day_of_week": 5, "start_time": "18:00", "end_time": "19:30"}]'::jsonb,
   8, 200000, NOW(), NOW());

-- 학생 40명 생성 (등록일, 첫 수업일, 결제일 다양하게 설정)
DO $$
DECLARE
  student_names TEXT[] := ARRAY[
    '김민수', '이지은', '박준호', '최수진', '정다은', '강호영', '윤서연', '임태현',
    '한소희', '오동현', '신유진', '조성민', '배지훈', '류하늘', '문서영', '고민준',
    '노예린', '마동석', '백지원', '송민규', '유재석', '이승기', '전지현', '차은우',
    '하하', '황정민', '김태희', '이병헌', '송혜교', '원빈', '장동건', '고수',
    '김하늘', '이영애', '전도연', '김혜수', '손예진', '한지민', '수지', '아이유'
  ];
  student_name TEXT;
  i INTEGER;
  registration_date DATE;
  first_class_date DATE;
  payment_due_day INTEGER;
  student_id UUID;
  current_date DATE := CURRENT_DATE;
  three_months_ago DATE := CURRENT_DATE - INTERVAL '3 months';
BEGIN
  FOR i IN 1..array_length(student_names, 1) LOOP
    -- 등록일: 3개월 전부터 현재까지 랜덤
    registration_date := three_months_ago + (RANDOM() * (current_date - three_months_ago))::INTEGER;
    
    -- 첫 수업일: 등록일 이후 1-7일 사이
    first_class_date := registration_date + (1 + RANDOM() * 6)::INTEGER;
    
    -- 결제일: 1-31일 랜덤 (대부분 25일)
    IF RANDOM() < 0.7 THEN
      payment_due_day := 25;
    ELSE
      payment_due_day := 1 + (RANDOM() * 30)::INTEGER;
    END IF;
    
    student_id := uuid_generate_v4();
    
    INSERT INTO students (
      id, name, phone, email, address, guardian_name, guardian_phone,
      payment_due_day, status, first_class_date, created_at, updated_at
    )
    VALUES (
      student_id,
      student_names[i],
      '010-' || LPAD((1000 + i)::TEXT, 4, '0') || '-' || LPAD((1000 + i * 2)::TEXT, 4, '0'),
      LOWER(REPLACE(student_names[i], ' ', '')) || '@example.com',
      '서울시 강남구 테헤란로 ' || i || '길',
      student_names[i] || ' 부모',
      '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((2000 + i * 2)::TEXT, 4, '0'),
      payment_due_day,
      'active', -- 기본값은 재학
      first_class_date,
      registration_date,
      registration_date
    );
  END LOOP;
END $$;

-- 일부 학생에게 마지막 수업일 설정 (마지막 수업일이 현재보다 이전이면 자동으로 그만둔 상태로 변경됨)
DO $$
DECLARE
  student_record RECORD;
  last_class_date_val DATE;
  current_date DATE := CURRENT_DATE;
  one_month_ago DATE := CURRENT_DATE - INTERVAL '1 month';
  two_months_ago DATE := CURRENT_DATE - INTERVAL '2 months';
BEGIN
  -- 10명의 학생에게 마지막 수업일 설정
  FOR student_record IN 
    SELECT id, first_class_date 
    FROM students 
    ORDER BY RANDOM() 
    LIMIT 10
  LOOP
    -- 마지막 수업일: 첫 수업일 이후부터 1-2개월 전까지 랜덤
    -- 첫 수업일보다 이전이 되지 않도록 보장
    DECLARE
      min_date DATE;
      max_date DATE;
    BEGIN
      -- 첫 수업일이 있으면 첫 수업일 이후, 없으면 2개월 전부터
      IF student_record.first_class_date IS NOT NULL THEN
        min_date := student_record.first_class_date;
      ELSE
        min_date := two_months_ago;
      END IF;
      
      max_date := one_month_ago;
      
      -- 마지막 수업일이 첫 수업일보다 이전이 되지 않도록
      IF min_date > max_date THEN
        min_date := max_date;
      END IF;
      
      last_class_date_val := min_date + (RANDOM() * (max_date - min_date))::INTEGER;
      
      -- 마지막 수업일만 설정 (상태는 자동으로 업데이트됨)
      UPDATE students
      SET last_class_date = last_class_date_val
      WHERE id = student_record.id;
    END;
  END LOOP;
END $$;

-- 수업 등록 (학생들을 랜덤하게 수업에 배정)
DO $$
DECLARE
  course_record RECORD;
  student_record RECORD;
  enrolled_count INTEGER;
  max_enrollments INTEGER;
BEGIN
  FOR course_record IN SELECT * FROM courses LOOP
    enrolled_count := 0;
    max_enrollments := 6 + (RANDOM() * 2)::INTEGER; -- 6-8명
    
    FOR student_record IN 
      SELECT * FROM students 
      WHERE status = 'active' OR status IS NULL
      ORDER BY RANDOM()
    LOOP
      IF enrolled_count >= max_enrollments THEN
        EXIT;
      END IF;
      
      -- 80% 확률로 등록
      IF RANDOM() < 0.8 THEN
        INSERT INTO course_enrollments (course_id, student_id, enrolled_at)
        VALUES (course_record.id, student_record.id, student_record.created_at)
        ON CONFLICT (course_id, student_id) DO NOTHING;
        
        enrolled_count := enrolled_count + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 3개월치 출석 데이터 생성
DO $$
DECLARE
  course_record RECORD;
  schedule_item JSONB;
  class_date DATE;
  start_date DATE;
  end_date DATE;
  day_of_week INTEGER;
  enrollment_record RECORD;
  status_options TEXT[] := ARRAY['present', 'late', 'absent', 'early'];
  status_weights INTEGER[] := ARRAY[70, 10, 15, 5]; -- 출석 70%, 지각 10%, 결석 15%, 조퇴 5%
  random_val NUMERIC;
  selected_status TEXT;
  i INTEGER;
BEGIN
  start_date := CURRENT_DATE - INTERVAL '3 months';
  end_date := CURRENT_DATE;
  
  -- 각 수업에 대해
  FOR course_record IN SELECT * FROM courses LOOP
    -- 수업 스케줄에 따라 출석 데이터 생성
    FOR schedule_item IN SELECT * FROM jsonb_array_elements(course_record.schedule) LOOP
      day_of_week := (schedule_item->>'day_of_week')::INTEGER;
      
      -- 3개월치 날짜 순회
      class_date := start_date;
      WHILE class_date <= end_date LOOP
        -- 해당 요일인지 확인
        IF EXTRACT(DOW FROM class_date) = day_of_week THEN
          -- 등록된 학생들에 대해 출석 데이터 생성
          FOR enrollment_record IN 
            SELECT ce.student_id, s.status, s.last_class_date
            FROM course_enrollments ce
            INNER JOIN students s ON ce.student_id = s.id
            WHERE ce.course_id = course_record.id
          LOOP
            -- 그만둔 학생이고 마지막 수업일 이후면 출석 데이터 생성 안 함
            IF enrollment_record.status = 'inactive' AND enrollment_record.last_class_date IS NOT NULL THEN
              IF class_date > enrollment_record.last_class_date THEN
                CONTINUE;
              END IF;
            END IF;
            
            -- 랜덤하게 출석 상태 결정
            random_val := RANDOM() * 100;
            selected_status := 'present';
            
            IF random_val < status_weights[1] THEN
              selected_status := status_options[1];
            ELSIF random_val < status_weights[1] + status_weights[2] THEN
              selected_status := status_options[2];
            ELSIF random_val < status_weights[1] + status_weights[2] + status_weights[3] THEN
              selected_status := status_options[3];
            ELSE
              selected_status := status_options[4];
            END IF;
            
            INSERT INTO attendance (course_id, student_id, date, status, created_at)
            VALUES (
              course_record.id,
              enrollment_record.student_id,
              class_date,
              selected_status,
              class_date
            )
            ON CONFLICT (course_id, student_id, date) DO NOTHING;
          END LOOP;
        END IF;
        
        class_date := class_date + INTERVAL '1 day';
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- 3개월치 학습일지 생성
DO $$
DECLARE
  course_record RECORD;
  schedule_item JSONB;
  class_date DATE;
  start_date DATE;
  end_date DATE;
  day_of_week INTEGER;
  log_content TEXT;
  homework_content TEXT;
  student_record RECORD;
  student_comments JSONB;
  comment_texts TEXT[];
  random_val NUMERIC;
BEGIN
  start_date := CURRENT_DATE - INTERVAL '3 months';
  end_date := CURRENT_DATE;
  
  -- 각 수업에 대해
  FOR course_record IN SELECT * FROM courses LOOP
    -- 수업 스케줄에 따라 학습일지 생성
    FOR schedule_item IN SELECT * FROM jsonb_array_elements(course_record.schedule) LOOP
      day_of_week := (schedule_item->>'day_of_week')::INTEGER;
      
      -- 3개월치 날짜 순회
      class_date := start_date;
      WHILE class_date <= end_date LOOP
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
          
          -- 학생별 개별 코멘트 생성
          student_comments := '{}'::jsonb;
          FOR student_record IN 
            SELECT s.* FROM students s
            INNER JOIN course_enrollments ce ON s.id = ce.student_id
            WHERE ce.course_id = course_record.id
            AND (s.status = 'active' OR s.status IS NULL OR (s.status = 'inactive' AND (s.last_class_date IS NULL OR class_date <= s.last_class_date)))
          LOOP
            -- 60% 확률로 코멘트 추가
            random_val := RANDOM();
            IF random_val < 0.6 THEN
              comment_texts := ARRAY[
                student_record.name || ' 학생이 오늘 수업에 적극적으로 참여했습니다.',
                student_record.name || ' 학생의 이해도가 좋아 보입니다.',
                student_record.name || ' 학생이 집중력 있게 수업에 임했습니다.',
                student_record.name || ' 학생의 발표가 인상적이었습니다.',
                student_record.name || ' 학생이 오늘 배운 내용을 잘 이해한 것 같습니다.',
                student_record.name || ' 학생이 수업 중 질문을 잘 했습니다.',
                student_record.name || ' 학생의 실력 향상이 눈에 띕니다.',
                student_record.name || ' 학생이 오늘 수업에서 좋은 아이디어를 제시했습니다.',
                student_record.name || ' 학생이 수업 내용을 잘 정리하고 있습니다.',
                student_record.name || ' 학생의 창의적인 접근이 돋보였습니다.'
              ];
              student_comments := student_comments || jsonb_build_object(
                student_record.id::TEXT,
                comment_texts[1 + floor(RANDOM() * array_length(comment_texts, 1))::INTEGER]
              );
            END IF;
          END LOOP;
          
          -- 학습일지 삽입
          INSERT INTO learning_logs (course_id, date, content, homework, notes, instructor_id, student_comments, created_at, updated_at)
          VALUES (
            course_record.id,
            class_date,
            log_content,
            homework_content,
            '수업 진행 상황 양호',
            course_record.instructor_id,
            CASE WHEN student_comments::text != '{}' THEN student_comments ELSE NULL END,
            class_date,
            class_date
          )
          ON CONFLICT (course_id, date) DO UPDATE SET
            student_comments = EXCLUDED.student_comments;
        END IF;
        
        class_date := class_date + INTERVAL '1 day';
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- 3개월치 결제 데이터 생성 (수강료 계산 로직 테스트용)
DO $$
DECLARE
  enrollment_record RECORD;
  course_record RECORD;
  student_record RECORD;
  payment_date DATE;
  payment_amount INTEGER;
  start_date DATE;
  end_date DATE;
  current_month_start DATE;
  current_month_end DATE;
  first_class_date_val DATE;
  last_class_date_val DATE;
  schedule JSONB;
  day_of_week INTEGER;
  class_days INTEGER;
  total_days INTEGER;
  remaining_days INTEGER;
  attended_days INTEGER;
  month_start DATE;
  month_end DATE;
  due_day INTEGER;
  total_days_in_month INTEGER;
BEGIN
  start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months');
  end_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day';
  
  -- 각 수업 등록에 대해
  FOR enrollment_record IN 
    SELECT ce.*, s.first_class_date, s.payment_due_day, s.status, s.last_class_date
    FROM course_enrollments ce
    INNER JOIN students s ON ce.student_id = s.id
  LOOP
    -- 수업 정보 조회
    SELECT * INTO course_record FROM courses WHERE id = enrollment_record.course_id;
    
    student_record := enrollment_record;
    first_class_date_val := enrollment_record.first_class_date;
    last_class_date_val := enrollment_record.last_class_date;
    due_day := enrollment_record.payment_due_day;
    IF due_day IS NULL THEN
      due_day := 25;
    END IF;
    
    schedule := course_record.schedule;
    
    -- 각 달에 대해 결제 생성
    current_month_start := start_date;
    WHILE current_month_start <= end_date LOOP
      current_month_end := (DATE_TRUNC('month', current_month_start) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      
      -- 결제일 계산
      payment_date := DATE_TRUNC('month', current_month_start) + (due_day - 1) * INTERVAL '1 day';
      
      -- 해당 달의 총 일수 계산
      total_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', current_month_start) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
      
      -- 첫 수업일이 해당 달에 있는 경우: 비례 계산 (해당 월 일수 기준)
      IF first_class_date_val >= current_month_start AND first_class_date_val <= current_month_end THEN
        -- 첫 수업일의 일자
        remaining_days := total_days_in_month - (EXTRACT(DAY FROM first_class_date_val)::INTEGER - 1);
        payment_amount := ROUND((course_record.tuition_fee::NUMERIC * remaining_days) / total_days_in_month);
      -- 그만둔 학생이고 마지막 수업일이 해당 달에 있는 경우: 비례 계산 (해당 월 일수 기준)
      ELSIF student_record.status = 'inactive' AND last_class_date_val IS NOT NULL 
            AND last_class_date_val >= current_month_start AND last_class_date_val <= current_month_end THEN
        -- 마지막 수업일의 일자
        attended_days := EXTRACT(DAY FROM last_class_date_val)::INTEGER;
        payment_amount := ROUND((course_record.tuition_fee::NUMERIC * attended_days) / total_days_in_month);
      -- 그만둔 학생이고 마지막 수업일이 해당 달 이전인 경우: 결제 생성 안 함
      ELSIF student_record.status = 'inactive' AND last_class_date_val IS NOT NULL 
            AND last_class_date_val < current_month_start THEN
        payment_amount := 0;
      -- 일반적인 경우: 전액
      ELSE
        payment_amount := course_record.tuition_fee;
      END IF;
      
      -- 결제 생성 (금액이 0보다 큰 경우만)
      IF payment_amount > 0 THEN
        INSERT INTO payments (student_id, course_id, amount, payment_method, payment_date, status, created_at)
        VALUES (
          enrollment_record.student_id,
          enrollment_record.course_id,
          payment_amount,
          'card',
          payment_date,
          CASE 
            WHEN payment_date < CURRENT_DATE THEN 
              CASE WHEN RANDOM() < 0.7 THEN 'confirmed' ELSE 'pending' END
            ELSE 'pending'
          END,
          payment_date
        )
        ON CONFLICT DO NOTHING;
      END IF;
      
      current_month_start := DATE_TRUNC('month', current_month_start) + INTERVAL '1 month';
    END LOOP;
  END LOOP;
END $$;

