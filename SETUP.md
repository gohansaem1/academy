# 데이터베이스 설정 가이드

## Supabase 테이블 생성하기

### 1단계: 환경 변수 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 다음 내용이 포함되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://krcncyrwiirgfvzsqpjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2단계: Supabase SQL Editor에서 실행

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `supabase/migrations/001_initial_schema.sql` 파일의 전체 내용을 복사
6. SQL Editor에 붙여넣기
7. **Run** 버튼 클릭 (또는 `Ctrl+Enter` / `Cmd+Enter`)

### 3단계: 테이블 생성 확인

SQL Editor에서 다음 쿼리를 실행하여 테이블이 생성되었는지 확인하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

다음 테이블들이 보여야 합니다:
- `attendance`
- `course_enrollments`
- `courses`
- `instructors`
- `payments`
- `students`

### 4단계: 테스트 데이터 삽입 (선택사항)

테스트를 위해 샘플 데이터를 삽입할 수 있습니다:

```sql
-- 강사 추가
INSERT INTO instructors (name, phone, subject) VALUES
  ('김선생', '010-1111-2222', '수학'),
  ('이선생', '010-3333-4444', '영어');

-- 학생 추가
INSERT INTO students (name, phone, guardian_name, guardian_phone) VALUES
  ('홍길동', '010-1234-5678', '홍부모', '010-9876-5432'),
  ('김철수', '010-2345-6789', '김부모', '010-8765-4321');

-- 수업 추가
INSERT INTO courses (name, subject, instructor_id, day_of_week, start_time, end_time, capacity, tuition_fee)
SELECT 
  '수학 기초반',
  '수학',
  id,
  1, -- 월요일
  '14:00',
  '15:30',
  20,
  100000
FROM instructors
WHERE subject = '수학'
LIMIT 1;
```

## 문제 해결

### 오류: "relation already exists"
- 테이블이 이미 존재하는 경우입니다. `DROP TABLE` 문을 사용하여 기존 테이블을 삭제하거나, `IF NOT EXISTS` 구문이 포함된 SQL을 사용하세요.

### 오류: "permission denied"
- Supabase 프로젝트의 권한을 확인하세요. SQL Editor에서 실행할 때는 관리자 권한이 필요합니다.

### RLS 정책 오류
- Row Level Security가 활성화되어 있지만 정책이 없으면 데이터에 접근할 수 없습니다. SQL 스크립트에 포함된 RLS 정책이 제대로 실행되었는지 확인하세요.

## 다음 단계

데이터베이스 설정이 완료되면:

1. 애플리케이션 개발을 시작할 수 있습니다
2. `src/lib/supabase/client.ts` 또는 `src/lib/supabase/server.ts`를 사용하여 데이터베이스에 접근할 수 있습니다
3. API 엔드포인트를 개발하여 프론트엔드와 연동할 수 있습니다

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [프로젝트 데이터베이스 설계 문서](./docs/DATABASE.md)

