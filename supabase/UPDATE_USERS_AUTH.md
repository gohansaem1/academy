# 사용자 인증 및 권한 관리 테이블 추가 SQL

회원 인증 및 권한 관리 기능을 사용하기 위해 Supabase에 다음 SQL을 실행해야 합니다.

## 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 아래 SQL 스크립트를 복사하여 붙여넣기
6. **Run** 버튼 클릭

## SQL 스크립트

```sql
-- 사용자 인증 및 권한 관리 테이블 생성

-- Users 테이블 생성 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'PARENT', 'TEACHER', 'ADMIN')),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학부모-학생 관계 테이블
CREATE TABLE IF NOT EXISTS parent_child (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id),
  CHECK (parent_id != student_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_parent_child_parent_id ON parent_child(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_student_id ON parent_child(student_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (개발 단계: 모든 사용자가 읽기/쓰기 가능)
-- 프로덕션에서는 적절한 권한 정책을 설정해야 합니다

-- users 정책
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
CREATE POLICY "Allow all operations for authenticated users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- parent_child 정책
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON parent_child;
CREATE POLICY "Allow all operations for authenticated users" ON parent_child
  FOR ALL USING (true) WITH CHECK (true);
```

## 확인

SQL 실행 후 다음 쿼리로 테이블이 생성되었는지 확인하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'parent_child');
```

## 참고

- `users` 테이블은 Supabase Auth의 `auth.users` 테이블과 연동됩니다
- 회원가입 시 Supabase Auth에 사용자가 생성되고, `users` 테이블에 추가 정보가 저장됩니다
- `parent_child` 테이블은 학부모와 학생 간의 관계를 관리합니다
- 프로덕션 환경에서는 RLS 정책을 더 엄격하게 설정해야 합니다

