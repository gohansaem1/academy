-- 관리자 비밀번호 재설정 가이드
-- 
-- ⚠️ 주의: 이 SQL 스크립트는 비밀번호를 직접 재설정할 수 없습니다.
-- Supabase Auth는 보안을 위해 비밀번호를 암호화하여 저장하므로,
-- 비밀번호 재설정은 Supabase Dashboard를 통해서만 가능합니다.
--
-- 이 스크립트는 관리자 계정 정보를 확인하는 용도로만 사용됩니다.

-- 1. 관리자 계정 확인
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  au.created_at as auth_created_at,
  au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'ADMIN';

-- 2. 관리자 이메일로 사용자 ID 확인
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@academy.local';

-- 3. 비밀번호 재설정 방법 안내
-- 
-- Supabase Dashboard에서 비밀번호를 재설정하려면:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. 관리자 계정(admin@academy.local) 선택
-- 3. "Update User" 또는 "Reset Password" 클릭
-- 4. 새 비밀번호 입력 및 저장
--
-- 또는 이메일 기반 재설정:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. 관리자 계정 선택
-- 3. "Reset Password" 클릭
-- 4. 이메일로 재설정 링크 수신
-- 5. 링크를 클릭하여 새 비밀번호 설정

-- 4. 초기 비밀번호로 재설정하려면 (Supabase Dashboard에서만 가능)
-- 
-- ⚠️ 보안 경고: 초기 비밀번호 '0000'은 매우 위험합니다.
-- 재설정 후 즉시 강력한 비밀번호로 변경하세요.
--
-- Supabase Dashboard > Authentication > Users > 관리자 계정 > Update User
-- Password 필드에 '0000' 입력 후 Save

