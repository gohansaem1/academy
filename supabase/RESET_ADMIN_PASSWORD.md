# 관리자 비밀번호 재설정 가이드

## ⚠️ 중요 안내

Supabase Auth는 보안을 위해 비밀번호를 암호화하여 저장합니다. 따라서 **비밀번호를 평문으로 확인할 수 없습니다**. 비밀번호를 잊어버린 경우 재설정만 가능합니다.

## 방법 1: Supabase Dashboard를 통한 비밀번호 재설정 (권장)

### 1단계: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Users** 탭 선택

### 2단계: 관리자 계정 찾기

1. 사용자 목록에서 관리자 이메일(`admin@academy.local` 또는 설정한 이메일)을 찾습니다
2. 해당 사용자 행의 **...** (더보기) 메뉴를 클릭합니다
3. **Reset Password** 또는 **Update User** 옵션을 선택합니다

### 3단계: 비밀번호 재설정

1. **Reset Password** 선택 시:
   - 이메일로 비밀번호 재설정 링크가 전송됩니다
   - 이메일을 확인하여 링크를 클릭하고 새 비밀번호를 설정합니다

2. **Update User** 선택 시:
   - 직접 새 비밀번호를 입력할 수 있습니다
   - **Password** 필드에 새 비밀번호를 입력합니다
   - **Save** 버튼을 클릭합니다

## 방법 2: SQL을 통한 비밀번호 재설정 (고급)

⚠️ **주의**: 이 방법은 Supabase의 내부 API를 사용하므로 주의가 필요합니다.

### 1단계: 관리자 사용자 ID 확인

SQL Editor에서 다음 쿼리를 실행하여 관리자 사용자 ID를 확인합니다:

```sql
-- auth.users에서 관리자 이메일로 사용자 ID 조회
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@academy.local';
```

### 2단계: 비밀번호 재설정

Supabase Dashboard의 **SQL Editor**에서 다음 SQL을 실행합니다:

```sql
-- 관리자 이메일로 비밀번호 재설정 (새 비밀번호: admin123!)
-- 주의: 이 방법은 Supabase의 내부 함수를 사용합니다
-- 실제로는 Supabase Dashboard의 Authentication > Users에서 직접 재설정하는 것이 더 안전합니다

-- 방법 1: Supabase Dashboard에서 직접 재설정 (권장)
-- Authentication > Users > 해당 사용자 > Update User > Password 변경

-- 방법 2: 이메일 기반 비밀번호 재설정 링크 발송
-- 이 방법은 Supabase의 내부 API를 사용하므로 Dashboard에서 직접 수행하는 것이 좋습니다
```

## 방법 3: 애플리케이션 내 비밀번호 찾기 기능 사용

현재 애플리케이션에는 비밀번호 찾기 기능이 없습니다. 필요하다면 다음 기능을 추가할 수 있습니다:

1. **비밀번호 찾기 페이지** (`/auth/forgot-password`)
2. 이메일 기반 비밀번호 재설정 링크 발송
3. 재설정 링크를 통한 새 비밀번호 설정

## 초기 비밀번호로 재설정하기

초기 비밀번호 `0000`으로 재설정하려면:

1. Supabase Dashboard > Authentication > Users
2. 관리자 계정 선택
3. **Update User** 클릭
4. **Password** 필드에 `0000` 입력
5. **Save** 클릭

⚠️ **보안 경고**: 초기 비밀번호 `0000`은 보안상 매우 위험합니다. 재설정 후 즉시 강력한 비밀번호로 변경하세요.

## 비밀번호 확인 불가 이유

Supabase Auth는 다음과 같은 보안 정책을 따릅니다:

1. **비밀번호 암호화**: 모든 비밀번호는 해시 함수를 통해 암호화되어 저장됩니다
2. **단방향 암호화**: 암호화된 비밀번호는 복호화할 수 없습니다
3. **로그아웃 후 접근 불가**: 로그아웃 후에는 세션이 만료되어 비밀번호를 확인할 수 없습니다

이는 **보안상 올바른 동작**입니다. 비밀번호를 평문으로 확인할 수 있다면 보안 위험이 매우 큽니다.

## 비밀번호 재설정 후 확인

비밀번호를 재설정한 후, 다음 방법으로 확인할 수 있습니다:

1. 애플리케이션 로그인 페이지에서 새 비밀번호로 로그인 시도
2. 로그인이 성공하면 비밀번호가 올바르게 재설정된 것입니다

## 문제 해결

### 문제: 비밀번호 재설정이 안 됨

1. Supabase Dashboard에서 사용자 계정이 활성화되어 있는지 확인
2. 이메일이 올바른지 확인
3. Supabase 프로젝트의 이메일 설정이 올바른지 확인

### 문제: 관리자 계정을 찾을 수 없음

다음 SQL로 관리자 계정을 확인합니다:

```sql
-- users 테이블에서 관리자 계정 확인
SELECT id, name, email, role, status
FROM users
WHERE role = 'ADMIN';

-- auth.users에서 관리자 계정 확인
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email LIKE '%admin%';
```

### 문제: 로그인 후 비밀번호 변경 페이지로 이동 안 됨

1. `/admin/settings` 페이지에서 직접 비밀번호 변경 가능
2. 또는 `/profile/change-password` 페이지 사용

## 보안 권장사항

1. **강력한 비밀번호 사용**: 최소 8자 이상, 대문자, 소문자, 숫자, 특수문자 포함
2. **정기적인 비밀번호 변경**: 3-6개월마다 비밀번호 변경
3. **초기 비밀번호 즉시 변경**: 초기 비밀번호 `0000`은 반드시 변경
4. **비밀번호 공유 금지**: 관리자 비밀번호는 절대 공유하지 마세요

## 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [비밀번호 보안 모범 사례](https://supabase.com/docs/guides/auth/password-reset)

