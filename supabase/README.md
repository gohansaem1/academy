# Supabase 마이그레이션 가이드

## 데이터베이스 스키마 생성 방법

### 방법 1: Supabase SQL Editor 사용 (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. `supabase/migrations/001_initial_schema.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭하여 실행

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치 (전역)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref krcncyrwiirgfvzsqpjy

# 마이그레이션 적용
supabase db push
```

## 생성되는 테이블

- `students` - 학생 정보
- `instructors` - 강사 정보
- `courses` - 수업 정보
- `course_enrollments` - 수업 등록 정보
- `attendance` - 출석 정보
- `payments` - 결제 정보

## 주의사항

- 이 스크립트는 기존 테이블이 있으면 건너뜁니다 (`IF NOT EXISTS` 사용)
- RLS 정책은 개발 단계에서 모든 사용자가 접근 가능하도록 설정되어 있습니다
- 프로덕션 환경에서는 적절한 권한 정책을 설정해야 합니다

## 테이블 확인

SQL Editor에서 다음 쿼리로 테이블 목록을 확인할 수 있습니다:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

