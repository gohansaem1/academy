# 관리자 계정 삭제 및 재생성 가이드

기존 관리자 계정을 삭제하고 동일한 아이디(`admin@academy.local`)로 새로 생성하는 방법입니다.

## ⚠️ 주의사항

- 이 작업은 기존 관리자 계정을 **완전히 삭제**합니다
- 삭제된 계정의 데이터는 복구할 수 없습니다
- 실행 전에 중요한 데이터가 있다면 백업하세요

## 방법 1: SQL 스크립트 사용 (권장)

### 1단계: 기존 관리자 계정 확인

Supabase SQL Editor에서 다음 쿼리를 실행하여 현재 관리자 계정을 확인합니다:

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'ADMIN' OR u.email = 'admin@academy.local';
```

### 2단계: users 테이블에서 관리자 계정 삭제

```sql
DELETE FROM users
WHERE role = 'ADMIN' OR email = 'admin@academy.local';
```

### 3단계: Supabase Dashboard에서 Auth 사용자 삭제

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Users** 탭 선택
5. `admin@academy.local` 계정 찾기
6. 해당 행의 **...** (더보기) 메뉴 클릭
7. **Delete User** 선택
8. 확인

### 4단계: 새 관리자 계정 생성 (Supabase Dashboard)

1. **Authentication > Users** 페이지에서
2. **Add user** 버튼 클릭
3. 다음 정보 입력:
   - **Email**: `admin@academy.local`
   - **Password**: `0000`
   - **Auto Confirm User**: 체크 ✅
4. **Create user** 버튼 클릭
5. 생성된 사용자의 **UUID**를 복사합니다

### 5단계: users 테이블에 관리자 정보 추가

복사한 UUID를 사용하여 다음 SQL을 실행합니다:

```sql
INSERT INTO users (id, name, role, email, phone, status)
VALUES (
  '여기에-복사한-UUID-입력',  -- 4단계에서 복사한 UUID
  '관리자',
  'ADMIN',
  'admin@academy.local',
  '010-0000-0000',
  'active'
);
```

### 6단계: 생성 확인

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'ADMIN' AND u.email = 'admin@academy.local';
```

## 방법 2: 자동 스크립트 사용

`supabase/recreate_admin.sql` 파일의 6단계를 실행하면 자동으로 처리됩니다.

⚠️ **주의**: 이 방법은 `auth.users`에 이미 `admin@academy.local` 사용자가 존재해야 합니다.

### 실행 순서

1. **3단계**: Supabase Dashboard에서 기존 사용자 삭제
2. **4단계**: Supabase Dashboard에서 새 사용자 생성
3. **6단계 SQL 실행**: `supabase/recreate_admin.sql`의 6단계 실행

```sql
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- auth.users에서 admin@academy.local 사용자 ID 조회
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@academy.local'
  LIMIT 1;

  -- users 테이블에 관리자 정보 추가
  IF admin_user_id IS NOT NULL THEN
    -- 기존 관리자 계정이 있으면 삭제
    DELETE FROM users WHERE id = admin_user_id OR email = 'admin@academy.local';
    
    -- 새 관리자 계정 추가
    INSERT INTO users (id, name, role, email, phone, status)
    VALUES (
      admin_user_id,
      '관리자',
      'ADMIN',
      'admin@academy.local',
      '010-0000-0000',
      'active'
    );
    
    RAISE NOTICE '관리자 계정이 재생성되었습니다. ID: %, 이메일: admin@academy.local, 비밀번호: 0000', admin_user_id;
  ELSE
    RAISE EXCEPTION 'auth.users에 admin@academy.local 사용자가 없습니다. 먼저 Supabase Dashboard에서 사용자를 생성해주세요.';
  END IF;
END $$;
```

## 완료 후 확인

재생성된 관리자 계정으로 로그인할 수 있는지 확인하세요:

- **이메일**: `admin@academy.local`
- **비밀번호**: `0000`

로그인 페이지(`/auth/login`)에서 테스트하세요.

## 문제 해결

### 문제: "auth.users에 admin@academy.local 사용자가 없습니다"

**해결**: 먼저 Supabase Dashboard에서 사용자를 생성해야 합니다.
- Authentication > Users > Add user
- Email: `admin@academy.local`
- Password: `0000`
- Auto Confirm User: 체크

### 문제: "permission denied" 오류

**해결**: Supabase SQL Editor에서 실행할 때는 관리자 권한이 필요합니다. 
- Supabase Dashboard의 SQL Editor를 사용하세요
- RLS 정책이 활성화되어 있으면 일시적으로 비활성화할 수 있습니다

### 문제: 로그인이 안 됨

**해결**:
1. `users` 테이블에 계정이 있는지 확인
2. `auth.users`에 계정이 있는지 확인
3. 이메일이 정확히 `admin@academy.local`인지 확인
4. 비밀번호가 `0000`인지 확인

## 참고

- [초기 관리자 계정 생성 가이드](./CREATE_INITIAL_ADMIN.md)
- [관리자 비밀번호 재설정 가이드](./RESET_ADMIN_PASSWORD.md)

