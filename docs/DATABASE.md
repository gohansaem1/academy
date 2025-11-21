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
| payment_due_day | integer | NULL, CHECK (1-31) | 매월 결제일 (1-31일) |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | 학생 상태 (active/inactive) |
| first_class_date | date | NULL | 첫 수업일 |
| last_class_date | date | NULL | 마지막 수업일 (그만둔 학생의 경우) |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

**비즈니스 로직**:
- `status`가 `inactive`이고 `last_class_date`가 현재 날짜보다 이전이면 자동으로 `inactive` 상태로 변경됨
- `first_class_date` 변경 시 첫 수업일 이전의 결제 항목이 자동으로 삭제되고 재생성됨
- `last_class_date` 변경 시 환불 항목이 자동으로 재생성됨

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
| day_of_week | integer | NOT NULL, CHECK (0-6) | 요일 (0=일요일, 6=토요일) - 호환성을 위해 유지 |
| start_time | time | NOT NULL | 시작 시간 - 호환성을 위해 유지 |
| end_time | time | NOT NULL | 종료 시간 - 호환성을 위해 유지 |
| schedule | jsonb | NULL | 수업 스케줄 (JSON 배열) |
| capacity | integer | NOT NULL, CHECK (> 0) | 정원 |
| tuition_fee | integer | NOT NULL, CHECK (>= 0) | 수강료 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

**schedule JSONB 구조**:
```json
[
  {
    "day_of_week": 2,
    "start_time": "14:00",
    "end_time": "15:30"
  },
  {
    "day_of_week": 4,
    "start_time": "14:00",
    "end_time": "15:30"
  },
  {
    "day_of_week": 6,
    "start_time": "10:00",
    "end_time": "11:30"
  }
]
```

**비즈니스 로직**:
- `schedule` 필드가 우선적으로 사용되며, 여러 요일과 각 요일별 시간 설정 가능
- `day_of_week`, `start_time`, `end_time`은 호환성을 위해 유지되지만, `schedule`의 첫 번째 항목 값으로 설정됨

#### course_enrollments (수업 등록)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 등록 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| enrolled_at | timestamp | DEFAULT now() | 등록일시 |

**제약조건**: (course_id, student_id) UNIQUE

**비즈니스 로직**:
- 학생이 수업에 등록되면 자동으로 결제 항목이 생성됨
- 첫 달은 `first_class_date` 기준으로 비례 계산된 금액
- 다음 달은 전액 수강료

#### attendance (출석)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 출석 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| date | date | NOT NULL | 출석일 |
| status | varchar(20) | NOT NULL, CHECK | 출석 상태 (present/late/absent/early) |
| created_at | timestamp | DEFAULT now() | 생성일시 |

**제약조건**: (course_id, student_id, date) UNIQUE

**출석 상태**:
- `present`: 출석
- `late`: 지각
- `absent`: 결석
- `early`: 조퇴

**출석률 계산**: `(present + late + early) / total * 100`

#### payments (결제 및 환불)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 결제/환불 ID |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| amount | integer | NOT NULL | 금액 (양수: 결제, 음수: 환불) |
| payment_method | varchar(20) | NOT NULL, CHECK | 결제 방법 (cash/card/transfer) |
| payment_date | date | NOT NULL | 결제일/환불일 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 상태 (pending/confirmed/cancelled) |
| type | varchar(20) | NOT NULL, DEFAULT 'payment' | 타입 (payment/refund) |
| created_at | timestamp | DEFAULT now() | 생성일시 |

**비즈니스 로직**:
- `type`이 `payment`인 경우: 수강료 결제 (양수 금액)
- `type`이 `refund`인 경우: 환불 (음수 금액)
- `status`가 `pending`인 경우: 미납/미지급
- `status`가 `confirmed`인 경우: 입금확인/환불확인
- `status`가 `cancelled`인 경우: 취소

**결제 생성 규칙**:
1. 학생이 수업에 등록되면 자동으로 결제 항목 생성
2. 첫 달: `first_class_date` 기준으로 해당 월 일수로 비례 계산
   - 예: 수강료 150,000원, 첫 수업일 10일 → (30-10+1)/30 * 150,000 = 105,000원
3. 다음 달: 전액 수강료
4. 결제일은 학생의 `payment_due_day` 사용 (없으면 25일)

**환불 생성 규칙**:
1. 학생이 `inactive` 상태로 변경되고 `last_class_date`가 설정되면 자동으로 환불 항목 생성
2. 환불 금액: 마지막 수업일 이후의 미수업 일수 기준으로 계산
   - 예: 수강료 150,000원, 마지막 수업일 10일 → (30-10)/30 * 150,000 = 100,000원 환불
3. 환불은 음수 금액으로 저장 (`amount < 0`)

#### learning_logs (학습일지)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 학습일지 ID |
| course_id | uuid | NOT NULL, FOREIGN KEY | 수업 ID |
| date | date | NOT NULL | 수업 날짜 |
| content | text | NOT NULL | 학습 내용 |
| homework | text | NULL | 숙제 |
| notes | text | NULL | 특이사항 |
| instructor_id | uuid | NOT NULL, FOREIGN KEY | 강사 ID (작성자) |
| student_comments | jsonb | NULL | 학생별 개별 코멘트 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

**제약조건**: (course_id, date) UNIQUE

**student_comments JSONB 구조**:
```json
{
  "student_id_1": "학생1에 대한 개별 코멘트",
  "student_id_2": "학생2에 대한 개별 코멘트"
}
```

**비즈니스 로직**:
- 강사/관리자는 모든 학생의 코멘트를 볼 수 있음
- 학생은 자신의 코멘트만 볼 수 있음
- 코멘트는 학습 내용에 자연스럽게 통합되어 표시됨

#### users (사용자)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY | 사용자 ID (Supabase Auth와 연동) |
| email | varchar(255) | NOT NULL, UNIQUE | 이메일 |
| password_hash | varchar(255) | NOT NULL | 비밀번호 해시 |
| name | varchar(100) | NOT NULL | 이름 |
| role | varchar(20) | NOT NULL, CHECK | 역할 (ADMIN/TEACHER/STUDENT/PARENT) |
| phone | varchar(20) | NULL | 전화번호 |
| created_at | timestamp | DEFAULT now() | 생성일시 |
| updated_at | timestamp | DEFAULT now() | 수정일시 |

**역할**:
- `ADMIN`: 관리자 (모든 권한)
- `TEACHER`: 강사 (수업 관리, 출석 체크, 학습일지 작성)
- `STUDENT`: 학생 (자신의 정보 조회, 학습일지 조회)
- `PARENT`: 학부모 (자녀 정보 조회)

#### parent_child (학부모-학생 관계)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 관계 ID |
| parent_id | uuid | NOT NULL, FOREIGN KEY | 학부모 ID (users.id) |
| student_id | uuid | NOT NULL, FOREIGN KEY | 학생 ID (students.id) |
| created_at | timestamp | DEFAULT now() | 생성일시 |

**제약조건**: (parent_id, student_id) UNIQUE

## 4. 데이터 관계도 (ERD)

```
users (사용자)
  ├── parent_child (학부모-학생 관계)
  │     └── students (학생)
  │           ├── course_enrollments (수업 등록)
  │           │     └── courses (수업)
  │           │           └── instructors (강사)
  │           ├── attendance (출석)
  │           ├── payments (결제/환불)
  │           └── learning_logs (학습일지) - student_comments
```

## 5. 주요 비즈니스 로직

### 5.1 학생 상태 관리

- 학생의 `last_class_date`가 현재 날짜보다 이전이면 자동으로 `status`가 `inactive`로 변경됨
- `status`가 `inactive`로 변경되면 환불 항목이 자동 생성됨

### 5.2 결제 관리

**첫 수업일 변경 시**:
1. 새로운 첫 수업일 이전의 모든 결제 항목 삭제
2. 새로운 첫 수업일 기준으로 결제 항목 재생성

**마지막 수업일 변경 시**:
1. 기존 환불 항목 삭제
2. 새로운 마지막 수업일 기준으로 환불 항목 재생성

### 5.3 수강료 계산

**첫 달 수강료** (비례 계산):
```
수강료 = (월 수강료 × 남은 일수) / 해당 월 총 일수
남은 일수 = 총 일수 - (첫 수업일 - 1)
```

**마지막 달 환불** (비례 계산):
```
환불 금액 = (월 수강료 × 미수업 일수) / 해당 월 총 일수
미수업 일수 = 총 일수 - 마지막 수업일
```

### 5.4 출석률 계산

```
출석률 = (출석 + 지각 + 조퇴) / 전체 수업 수 × 100
```

## 6. 인덱스

### 6.1 주요 인덱스

```sql
-- students 테이블
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_first_class_date ON students(first_class_date);
CREATE INDEX idx_students_last_class_date ON students(last_class_date);

-- courses 테이블
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_schedule ON courses USING GIN(schedule);

-- course_enrollments 테이블
CREATE INDEX idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON course_enrollments(student_id);

-- attendance 테이블
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- payments 테이블
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_course_id ON payments(course_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_type_status ON payments(type, status);

-- learning_logs 테이블
CREATE INDEX idx_learning_logs_course_id ON learning_logs(course_id);
CREATE INDEX idx_learning_logs_date ON learning_logs(date);
CREATE INDEX idx_learning_logs_instructor_id ON learning_logs(instructor_id);
CREATE INDEX idx_learning_logs_student_comments ON learning_logs USING GIN(student_comments);

-- users 테이블
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- parent_child 테이블
CREATE INDEX idx_parent_child_parent_id ON parent_child(parent_id);
CREATE INDEX idx_parent_child_student_id ON parent_child(student_id);
```

## 7. Row Level Security (RLS) 정책

보안을 위해 RLS를 활성화하고 정책을 설정합니다:

```sql
-- RLS 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Allow all operations for authenticated users" ON learning_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON parent_child
  FOR ALL USING (true) WITH CHECK (true);
```

## 8. 마이그레이션 순서

데이터베이스 스키마를 생성할 때는 다음 순서로 마이그레이션 파일을 실행해야 합니다:

1. `001_initial_schema.sql` - 기본 테이블 생성
2. `002_learning_logs.sql` - 학습일지 테이블 생성
3. `003_update_attendance_early.sql` - 출석 테이블에 early 상태 추가
4. `004_update_payments_status.sql` - 결제 테이블에 confirmed 상태 추가
5. `005_add_users_auth.sql` - 사용자 인증 테이블 생성
6. `006_create_initial_admin.sql` - 초기 관리자 계정 생성
7. `007_add_course_schedule.sql` - 수업 스케줄 JSONB 필드 추가
8. `008_add_payment_due_day_to_students.sql` - 학생 테이블에 결제일 필드 추가
9. `009_add_student_comments_to_learning_logs.sql` - 학습일지에 학생 코멘트 필드 추가
10. `010_sample_data.sql` - 샘플 데이터 생성 (선택사항)
11. `011_add_student_status.sql` - 학생 상태 필드 추가
12. `012_add_last_class_date_to_students.sql` - 마지막 수업일 필드 추가
13. `013_add_first_class_date_to_students.sql` - 첫 수업일 필드 추가
14. `014_update_sample_data_3months.sql` - 3개월치 샘플 데이터 생성 (선택사항)
15. `017_refactor_payments_structure.sql` - 결제/환불 구조 개선 (type 필드 추가)

## 9. Supabase 클라이언트 사용법

### 9.1 클라이언트 컴포넌트에서 사용

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

### 9.2 서버 컴포넌트에서 사용

```typescript
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
const { data } = await supabase.from('students').select('*');
```

## 10. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [JSONB 데이터 타입](https://www.postgresql.org/docs/current/datatype-json.html)
