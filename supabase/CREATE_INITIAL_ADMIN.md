# 초기 관리자 계정 생성 가이드

초기 관리자 계정을 생성하는 방법입니다.

## 방법 1: Supabase Dashboard를 통한 생성 (권장)

### 1단계: Supabase Auth에서 사용자 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Users** 탭 선택
5. **Add user** 버튼 클릭
6. 다음 정보 입력:
   - **Email**: `admin@academy.local` (또는 원하는 이메일)
   - **Password**: `0000`
   - **Auto Confirm User**: 체크 (이메일 확인 자동 완료)
7. **Create user** 버튼 클릭
8. 생성된 사용자의 **UUID**를 복사합니다

### 2단계: users 테이블에 관리자 정보 추가

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. 아래 SQL을 복사하여 붙여넣기 (UUID를 실제 값으로 교체):

```sql
-- 1단계에서 복사한 UUID로 교체하세요
INSERT INTO users (id, name, role, email, phone, status)
VALUES (
  '여기에-실제-UUID-입력',
  '관리자',
  'ADMIN',
  'admin@academy.local',
  '010-0000-0000',
  'active'
)
ON CONFLICT (id) DO NOTHING;
```

4. **Run** 버튼 클릭

### 3단계: 확인

다음 쿼리로 관리자 계정이 생성되었는지 확인:

```sql
SELECT id, name, role, email, status 
FROM users 
WHERE role = 'ADMIN';
```

## 방법 2: SQL 스크립트를 통한 자동 생성

Supabase Auth에서 사용자를 먼저 생성한 후, 아래 SQL을 실행:

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
    INSERT INTO users (id, name, role, email, phone, status)
    VALUES (
      admin_user_id,
      '관리자',
      'ADMIN',
      'admin@academy.local',
      '010-0000-0000',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '관리자 계정이 생성되었습니다. ID: %', admin_user_id;
  ELSE
    RAISE EXCEPTION 'admin@academy.local 사용자를 먼저 Supabase Auth에서 생성해주세요.';
  END IF;
END $$;
```

## 로그인 정보

- **이메일**: `admin@academy.local`
- **비밀번호**: `0000`
- **역할**: 관리자 (ADMIN)

## 보안 권장사항

⚠️ **중요**: 초기 비밀번호 `0000`은 보안상 위험하므로, 첫 로그인 후 반드시 비밀번호를 변경하세요.

비밀번호 변경은 웹 애플리케이션의 **프로필 설정** 또는 **비밀번호 변경** 페이지에서 가능합니다.

