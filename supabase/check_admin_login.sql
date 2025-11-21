-- 관리자 계정 로그인 문제 진단 스크립트
-- 
-- 이 스크립트를 실행하여 관리자 계정 상태를 확인하세요.

-- 1. auth.users에서 관리자 계정 확인
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'admin@academy.local';

-- 2. users 테이블에서 관리자 계정 확인
SELECT 
  id,
  name,
  email,
  role,
  status,
  phone
FROM users
WHERE email = 'admin@academy.local' OR role = 'ADMIN';

-- 3. 두 테이블의 ID 일치 여부 확인
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '일치'
    ELSE '불일치 - 문제 있음!'
  END as id_match
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'admin@academy.local';

-- 4. 문제 해결: ID가 불일치하는 경우
-- 
-- 만약 ID가 불일치한다면, 아래 SQL을 실행하여 수정하세요:
-- 
-- UPDATE users
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@academy.local')
-- WHERE email = 'admin@academy.local';

-- 5. users 테이블에 관리자 계정이 없는 경우 생성
-- 
-- 아래 SQL을 실행하여 관리자 계정을 users 테이블에 추가하세요:
-- 
-- DO $$
-- DECLARE
--   admin_user_id UUID;
-- BEGIN
--   SELECT id INTO admin_user_id
--   FROM auth.users
--   WHERE email = 'admin@academy.local'
--   LIMIT 1;
--
--   IF admin_user_id IS NOT NULL THEN
--     INSERT INTO users (id, name, role, email, phone, status)
--     VALUES (
--       admin_user_id,
--       '관리자',
--       'ADMIN',
--       'admin@academy.local',
--       '010-0000-0000',
--       'active'
--     )
--     ON CONFLICT (id) DO UPDATE
--     SET 
--       name = '관리자',
--       role = 'ADMIN',
--       email = 'admin@academy.local',
--       phone = '010-0000-0000',
--       status = 'active';
--     
--     RAISE NOTICE '✅ 관리자 계정이 생성/업데이트되었습니다.';
--   ELSE
--     RAISE EXCEPTION '❌ auth.users에 admin@academy.local 사용자가 없습니다.';
--   END IF;
-- END $$;

