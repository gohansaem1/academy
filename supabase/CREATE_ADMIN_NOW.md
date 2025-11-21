# 관리자 계정 생성하기 (삭제 후 재생성)

관리자 계정이 삭제된 상태에서 새로 생성하는 방법입니다.

## 빠른 생성 방법

### 1단계: Supabase Dashboard에서 사용자 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Users** 탭 선택
5. **Add user** 버튼 클릭
6. 다음 정보 입력:
   - **Email**: `admin@academy.local`
   - **Password**: `0000`
   - **Auto Confirm User**: ✅ 체크 (중요!)
7. **Create user** 버튼 클릭
8. 생성 완료 확인

### 2단계: SQL Editor에서 users 테이블에 추가

1. Supabase Dashboard에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. `supabase/create_admin_now.sql` 파일의 **3단계** SQL을 복사하여 붙여넣기
4. **Run** 버튼 클릭 (또는 `Ctrl+Enter` / `Cmd+Enter`)

또는 아래 SQL을 직접 실행:

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
    -- 기존 관리자 계정이 있으면 삭제 (혹시 모를 중복 방지)
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
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      name = '관리자',
      role = 'ADMIN',
      email = 'admin@academy.local',
      phone = '010-0000-0000',
      status = 'active';
    
    RAISE NOTICE '✅ 관리자 계정이 생성되었습니다!';
    RAISE NOTICE '   ID: %', admin_user_id;
    RAISE NOTICE '   이메일: admin@academy.local';
    RAISE NOTICE '   비밀번호: 0000';
  ELSE
    RAISE EXCEPTION '❌ auth.users에 admin@academy.local 사용자가 없습니다. 먼저 Supabase Dashboard에서 사용자를 생성해주세요.';
  END IF;
END $$;
```

### 3단계: 생성 확인

SQL Editor에서 다음 쿼리를 실행하여 확인:

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

결과가 나오면 성공입니다!

### 4단계: 로그인 테스트

웹 애플리케이션의 로그인 페이지(`/auth/login`)에서:
- **이메일**: `admin@academy.local`
- **비밀번호**: `0000`

으로 로그인할 수 있는지 확인하세요.

## 문제 해결

### 오류: "auth.users에 admin@academy.local 사용자가 없습니다"

**원인**: 1단계에서 Supabase Dashboard에서 사용자를 생성하지 않았습니다.

**해결**: 
1. Supabase Dashboard > Authentication > Users
2. Add user 클릭
3. Email: `admin@academy.local`, Password: `0000`, Auto Confirm User: 체크
4. Create user 클릭
5. 다시 2단계 SQL 실행

### 오류: "permission denied"

**원인**: SQL Editor 권한 문제

**해결**: 
- Supabase Dashboard의 SQL Editor를 사용하세요
- 프로젝트 관리자 권한이 필요할 수 있습니다

### 로그인이 안 됨

**확인 사항**:
1. `users` 테이블에 계정이 있는지 확인 (3단계 쿼리 실행)
2. `auth.users`에 계정이 있는지 확인:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@academy.local';
   ```
3. 이메일이 정확히 `admin@academy.local`인지 확인
4. 비밀번호가 정확히 `0000`인지 확인

## 완료!

관리자 계정이 성공적으로 생성되었습니다. 이제 로그인하여 사용할 수 있습니다.

⚠️ **보안 권장사항**: 초기 비밀번호 `0000`은 보안상 매우 위험하므로, 로그인 후 즉시 강력한 비밀번호로 변경하세요.

