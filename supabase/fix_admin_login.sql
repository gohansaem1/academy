-- 관리자 계정 로그인 문제 해결 스크립트
-- 
-- 이 스크립트는 auth.users와 users 테이블의 ID를 일치시키고
-- 관리자 계정이 올바르게 설정되도록 합니다.

-- 1단계: 현재 상태 확인
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@academy.local'
UNION ALL
SELECT 
  'users' as table_name,
  id,
  email,
  created_at
FROM users
WHERE email = 'admin@academy.local' OR role = 'ADMIN';

-- 2단계: ID 불일치 확인
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  CASE 
    WHEN au.id = u.id THEN '✅ 일치'
    WHEN u.id IS NULL THEN '❌ users 테이블에 없음'
    ELSE '❌ 불일치'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id OR u.email = au.email
WHERE au.email = 'admin@academy.local';

-- 3단계: 자동 수정 (ID 불일치 해결 및 관리자 계정 생성/업데이트)
DO $$
DECLARE
  auth_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- auth.users에서 관리자 계정 ID 조회
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'admin@academy.local'
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION '❌ auth.users에 admin@academy.local 사용자가 없습니다. 먼저 Supabase Dashboard에서 사용자를 생성해주세요.';
  END IF;

  -- users 테이블에서 기존 관리자 계정 확인 (ID 또는 이메일로)
  SELECT id INTO existing_user_id
  FROM users
  WHERE id = auth_user_id OR email = 'admin@academy.local'
  LIMIT 1;

  IF existing_user_id IS NOT NULL AND existing_user_id != auth_user_id THEN
    -- ID가 다른 경우, 기존 레코드 삭제
    DELETE FROM users WHERE id = existing_user_id;
    RAISE NOTICE '기존 관리자 계정 삭제됨 (ID: %)', existing_user_id;
  END IF;

  -- users 테이블에 관리자 계정 생성/업데이트
  INSERT INTO users (id, name, role, email, phone, status)
  VALUES (
    auth_user_id,
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
  
  RAISE NOTICE '✅ 관리자 계정이 생성/업데이트되었습니다.';
  RAISE NOTICE '   Auth ID: %', auth_user_id;
  RAISE NOTICE '   이메일: admin@academy.local';
  
END $$;

-- 4단계: 최종 확인
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  CASE 
    WHEN u.id = au.id THEN '✅ 정상'
    ELSE '❌ 문제 있음'
  END as status
FROM users u
INNER JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@academy.local' AND u.role = 'ADMIN';

