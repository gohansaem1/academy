# Supabase 비밀번호 정책 업데이트 가이드

## 문제 상황

Chrome 브라우저에서 비밀번호 유출 경고가 표시되는 경우, Supabase의 비밀번호 정책을 확인하고 조정할 수 있습니다.

## 해결 방법

### 방법 1: Supabase Dashboard에서 비밀번호 정책 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Settings** 탭 선택
5. **Password Policy** 섹션 확인:
   - 최소 비밀번호 길이
   - 비밀번호 복잡도 요구사항
   - 노출된 비밀번호 검사 활성화 여부

### 방법 2: 초기 비밀번호 변경

초기 관리자 비밀번호를 더 복잡하게 변경:

1. **Authentication** > **Users** 메뉴로 이동
2. 관리자 계정 찾기 (`admin@academy.local`)
3. **Actions** > **Reset Password** 클릭
4. 새 비밀번호 설정 (예: `Admin@Academy2024!`)
5. 사용자에게 새 비밀번호 전달

### 방법 3: 사용자 비밀번호 재설정

기존 사용자의 비밀번호를 재설정:

```sql
-- Supabase SQL Editor에서 실행
-- 주의: 이 방법은 Supabase Auth API를 통해서만 가능합니다
-- 직접 SQL로는 비밀번호를 변경할 수 없습니다
```

대신 Supabase Dashboard에서:
1. **Authentication** > **Users**
2. 사용자 선택
3. **Actions** > **Reset Password**
4. 새 비밀번호 설정

### 방법 4: 비밀번호 정책 강화 (SQL)

비밀번호 정책을 강화하려면 Supabase의 Auth 설정을 사용해야 합니다.
SQL로 직접 변경할 수는 없지만, 다음을 확인할 수 있습니다:

```sql
-- 현재 사용자 목록 확인
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'admin@academy.local';
```

## Chrome 경고 해결

### Chrome 경고가 표시되는 이유

1. **간단한 비밀번호**: `0000` 같은 4자리 숫자
2. **노출된 비밀번호**: 데이터 유출 사고에 포함된 비밀번호
3. **재사용된 비밀번호**: 다른 사이트에서 사용된 비밀번호

### 해결 단계

1. **비밀번호 변경**:
   - 로그인 페이지에서 로그인 시도
   - 경고 표시 시 "비밀번호 변경" 클릭
   - 또는 `/profile/change-password` 직접 접속
   - 강력한 새 비밀번호 설정 (최소 8자, 대소문자, 숫자, 특수문자)

2. **Chrome 비밀번호 저장 업데이트**:
   - 새 비밀번호로 로그인 성공
   - Chrome이 새 비밀번호를 저장하도록 허용
   - Chrome이 자동으로 경고 해제

3. **확인**:
   - 로그아웃 후 다시 로그인
   - Chrome 경고가 사라졌는지 확인

## 권장 초기 비밀번호

초기 관리자 계정 생성 시 다음 형식의 비밀번호를 권장합니다:

```
형식: [조직명]@[연도]!
예시:
- Admin@Academy2024!
- Academy@Admin2024!
- Admin123!@#
```

### 비밀번호 요구사항

- **최소 8자 이상**
- **대문자 포함** (A-Z)
- **소문자 포함** (a-z)
- **숫자 포함** (0-9)
- **특수문자 포함** (!@#$%^&*)
- **일반적인 단어나 패턴 피하기**

## Supabase Auth 설정 확인

### 확인할 사항

1. **Email Confirmation**:
   - 개발 단계: 비활성화 권장 (Auto Confirm User 사용)
   - 프로덕션: 활성화 권장

2. **Password Reset**:
   - 활성화되어 있는지 확인
   - 이메일 템플릿 설정 확인

3. **Session Timeout**:
   - 기본값 확인
   - 필요시 조정

## 보안 체크리스트

- [ ] 초기 비밀번호가 `0000`이 아닌 강력한 비밀번호로 변경됨
- [ ] 모든 사용자가 강력한 비밀번호를 사용하고 있음
- [ ] 비밀번호 변경 기능이 정상 작동함
- [ ] Chrome 경고가 더 이상 표시되지 않음
- [ ] Supabase Dashboard에서 비밀번호 정책 확인 완료
- [ ] 정기적인 비밀번호 변경 계획 수립

## 참고

- Supabase는 기본적으로 Have I Been Pwned 데이터베이스와 연동하여 노출된 비밀번호를 차단합니다.
- Chrome의 비밀번호 경고는 브라우저의 보안 기능으로, 애플리케이션과는 독립적으로 작동합니다.
- 강력한 비밀번호를 사용하면 대부분의 경고가 해결됩니다.

