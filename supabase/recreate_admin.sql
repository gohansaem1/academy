-- 관리자 계정 삭제 및 재생성 스크립트
-- 
-- ⚠️ 주의: 이 스크립트는 기존 관리자 계정을 완전히 삭제하고 새로 생성합니다.
-- 실행 전에 백업을 권장합니다.

-- 1단계: 기존 관리자 계정 확인
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'ADMIN' OR u.email = 'admin@academy.local';

-- 2단계: users 테이블에서 관리자 계정 삭제
DELETE FROM users
WHERE role = 'ADMIN' OR email = 'admin@academy.local';

-- 3단계: Supabase Auth에서 관리자 계정 삭제
-- ⚠️ 주의: auth.users 테이블은 직접 삭제할 수 없습니다.
-- Supabase Dashboard에서 수동으로 삭제해야 합니다:
-- 
-- 방법:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. admin@academy.local 계정 찾기
-- 3. ... (더보기) 메뉴 클릭
-- 4. "Delete User" 선택
-- 5. 확인
--
-- 또는 아래 SQL을 실행 (주의: RLS 정책에 따라 실패할 수 있음)
-- DELETE FROM auth.users WHERE email = 'admin@academy.local';

-- 4단계: Supabase Dashboard에서 새 관리자 계정 생성
-- 
-- 1. Supabase Dashboard > Authentication > Users
-- 2. "Add user" 버튼 클릭
-- 3. 다음 정보 입력:
--    - Email: admin@academy.local
--    - Password: 0000
--    - Auto Confirm User: 체크
-- 4. "Create user" 클릭
-- 5. 생성된 사용자의 UUID를 복사

-- 5단계: users 테이블에 관리자 정보 추가
-- 
-- 아래 SQL에서 {USER_ID_HERE}를 4단계에서 복사한 UUID로 교체하세요
--
-- INSERT INTO users (id, name, role, email, phone, status)
-- VALUES (
--   '{USER_ID_HERE}',  -- 4단계에서 복사한 UUID로 교체
--   '관리자',
--   'ADMIN',
--   'admin@academy.local',
--   '010-0000-0000',
--   'active'
-- );

-- 6단계: 자동으로 관리자 계정 생성 (auth.users에 이미 존재하는 경우)
-- 
-- 아래 SQL은 auth.users에 admin@academy.local이 이미 존재하는 경우
-- 자동으로 users 테이블에 추가합니다.
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

-- 7단계: 생성 확인
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'ADMIN' AND u.email = 'admin@academy.local';

