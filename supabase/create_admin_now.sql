-- 관리자 계정 생성 스크립트 (삭제 후 재생성용)
-- 
-- ⚠️ 주의: 이 스크립트를 실행하기 전에 먼저 Supabase Dashboard에서
-- Authentication > Users에서 admin@academy.local 사용자를 생성해야 합니다.

-- 1단계: 현재 관리자 계정 확인
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

-- 2단계: auth.users에 admin@academy.local이 있는지 확인
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'admin@academy.local';

-- 3단계: 자동으로 관리자 계정 생성
-- 
-- 이 스크립트는 auth.users에 admin@academy.local이 이미 존재하는 경우
-- 자동으로 users 테이블에 관리자 정보를 추가합니다.
--
-- ⚠️ 먼저 Supabase Dashboard에서 사용자를 생성하세요:
-- Authentication > Users > Add user
-- Email: admin@academy.local
-- Password: 0000
-- Auto Confirm User: 체크
--
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

-- 4단계: 생성 확인
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

