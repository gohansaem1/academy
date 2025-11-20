# 데이터베이스 설계 문서

## 1. 개요

학원 관리 시스템은 Supabase(PostgreSQL 기반)를 데이터베이스로 사용합니다.

## 2. Supabase 설정

### 2.1 연결 정보

- **URL**: `https://krcncyrwiirgfvzsqpjy.supabase.co`
- **API Key**: 환경 변수로 관리 (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 2.2 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://krcncyrwiirgfvzsqpjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. 데이터베이스 스키마

### 3.1 테이블 구조

#### students (학생)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 학생 ID |
| name | varchar(100) | NOT NULL | 학생 이름 |
| phone | varchar(20) | NOT NULL, UNIQUE | 전화번호 |
| email | varchar(255) | NULL | 이메일 |
| address | text | NULL | 주소 |
| guardian_name | varchar(100) | NOT NULL | 보호자 이름 |
| guardian_phone | varchar(20) | NOT NULL | 보호자 전화번호 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

#### instructors (강사)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 강사 ID |
| name | varchar(100) | NOT NULL | 강사 이름 |
| phone | varchar(20) | NOT NULL, UNIQUE | 전화번호 |
| email | varchar(255) | NULL | 이메일 |
| subject | varchar(50) | NOT NULL | 담당 과목 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

#### courses (수업)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 수업 ID |
| name | varchar(100) | NOT NULL | 수업명 |
| subject | varchar(50) | NOT NULL | 과목명 |
| instructor_id | uuid | NOT NULL, FOREIGN KEY | 강사 ID |
| day_of_week | integer | NOT NULL, CHECK (0-6) | 요일 (0=일요일, 6=토요일) |
| start_time | time | NOT NULL | 시작 시간 |
| end_time | time | NOT NULL | 종료 시간 |
| capacity | integer | NOT NULL, CHECK (> 0) | 정원 |
| tuition_fee | integer | NOT NULL, CHECK (>= 0) | 수강료 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

#### course_enrollments (수업 등록)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 등록 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| enrolled_at | timestamp | DEFAULT now() | 등록일시 |

**제약조건**: (course_id, student_id) UNIQUE

#### attendance (출석)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 출석 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| date | date | NOT NULL | 출석일 |
| status | varchar(20) | NOT NULL, CHECK | 출석 상태 (present/late/absent) |
| created_at | timestamp | DEFAULT now() | 생성일시 |

**제약조건**: (course_id, student_id, date) UNIQUE

#### payments (결제)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 결제 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| amount | integer | NOT NULL, CHECK (> 0) | 결제 금액 |
| payment_method | varchar(20) | NOT NULL, CHECK | 결제 방법 (cash/card/transfer) |
| payment_date | date | NOT NULL | 결제일 |
| status | varchar(20) | NOT NULL, DEFAULT 'completed' | 결제 상태 (completed/pending/cancelled) |
| created_at | timestamp | DEFAULT now() | 생성일시 |

#### learning_logs (학습일지) ✅

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 학습일지 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| date | date | NOT NULL | 수업 날짜 |
| content | text | NOT NULL | 학습 내용 |
| homework | text | NULL | 숙제 |
| notes | text | NULL | 특이사항 |
| instructor_id | uuid | NOT NULL, FOREIGN KEY | 강사 ID (작성자) |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

**제약조건**: (course_id, date) UNIQUE

## 4. SQL 스크립트

### 4.1 테이블 생성

Supabase SQL Editor에서 다음 스크립트를 실행하여 테이블을 생성합니다:

```sql
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- students 테이블
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  address TEXT,
  guardian_name VARCHAR(100) NOT NULL,
  guardian_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- instructors 테이블
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  subject VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- courses 테이블
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  tuition_fee INTEGER NOT NULL CHECK (tuition_fee >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- course_enrollments 테이블
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- attendance 테이블
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id, date)
);

-- payments 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 인덱스 생성

성능 향상을 위한 인덱스를 생성합니다:

```sql
-- students 테이블 인덱스
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_name ON students(name);

-- instructors 테이블 인덱스
CREATE INDEX idx_instructors_subject ON instructors(subject);
CREATE INDEX idx_instructors_phone ON instructors(phone);

-- courses 테이블 인덱스
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_subject ON courses(subject);

-- course_enrollments 테이블 인덱스
CREATE INDEX idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON course_enrollments(student_id);

-- attendance 테이블 인덱스
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- payments 테이블 인덱스
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_course_id ON payments(course_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
```

## 5. Row Level Security (RLS) 정책

보안을 위해 RLS를 활성화하고 정책을 설정합니다:

```sql
-- RLS 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (개발 단계)
-- 프로덕션에서는 적절한 권한 정책을 설정해야 합니다
CREATE POLICY "Allow all operations for authenticated users" ON students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON instructors
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON courses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON course_enrollments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON attendance
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON payments
  FOR ALL USING (true) WITH CHECK (true);
```

## 6. Supabase 클라이언트 사용법

### 6.1 클라이언트 컴포넌트에서 사용

```typescript
import { supabase } from '@/lib/supabase/client';

// 데이터 조회
const { data, error } = await supabase
  .from('students')
  .select('*');

// 데이터 삽입
const { data, error } = await supabase
  .from('students')
  .insert({
    name: '홍길동',
    phone: '010-1234-5678',
    guardian_name: '홍부모',
    guardian_phone: '010-9876-5432'
  });

// 데이터 수정
const { data, error } = await supabase
  .from('students')
  .update({ name: '홍길동' })
  .eq('id', studentId);

// 데이터 삭제
const { error } = await supabase
  .from('students')
  .delete()
  .eq('id', studentId);
```

### 6.2 서버 컴포넌트에서 사용

```typescript
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
const { data } = await supabase.from('students').select('*');
```

## 7. 데이터베이스 마이그레이션

Supabase CLI를 사용하여 마이그레이션을 관리할 수 있습니다:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 개발 환경 초기화
supabase init

# 마이그레이션 파일 생성
supabase migration new create_tables

# 마이그레이션 적용
supabase db push
```

## 8. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)

