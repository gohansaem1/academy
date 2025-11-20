# 보안 정책 및 설정 가이드

## 1. 비밀번호 보안 정책

### 1.1 Supabase 기본 비밀번호 정책

Supabase는 기본적으로 다음 비밀번호 정책을 적용합니다:

- **최소 길이**: 6자 이상
- **복잡도**: 특별한 요구사항 없음 (하지만 Chrome 등 브라우저가 추가 검증)
- **노출된 비밀번호 검사**: Have I Been Pwned 데이터베이스와 연동하여 노출된 비밀번호 차단

### 1.2 Chrome 브라우저 비밀번호 경고

Chrome 브라우저는 다음 경우에 비밀번호 유출 경고를 표시합니다:

1. **간단한 비밀번호**: `0000`, `1234`, `password` 등
2. **노출된 비밀번호**: 데이터 유출 사고에 포함된 비밀번호
3. **재사용된 비밀번호**: 다른 사이트에서 사용된 비밀번호

### 1.3 초기 비밀번호 문제

초기 관리자 비밀번호 `0000`은 다음 이유로 보안 경고가 발생합니다:

- 너무 간단함 (4자리 숫자만)
- 일반적으로 사용되는 약한 비밀번호
- Chrome이 자동으로 위험하다고 판단

## 2. 해결 방법

### 2.1 초기 비밀번호 변경 (권장)

초기 비밀번호를 더 복잡하게 설정:

```sql
-- Supabase Dashboard > Authentication > Users에서
-- 비밀번호를 더 복잡한 것으로 변경 (예: Admin123!@#)
```

또는 초기 비밀번호 생성 시 더 복잡한 비밀번호 사용:

```
초기 비밀번호 예시:
- Admin@2024!
- Academy#123
- Admin123!@#
```

### 2.2 Supabase 비밀번호 정책 설정

Supabase Dashboard에서 비밀번호 정책을 강화할 수 있습니다:

1. **Supabase Dashboard** 접속
2. **Authentication** > **Policies** 메뉴
3. **Password Policy** 설정:
   - 최소 길이: 8자 이상 권장
   - 복잡도 요구사항 설정 (선택사항)

### 2.3 Chrome 경고 처리

Chrome 경고가 표시되더라도:

1. **"비밀번호 변경" 클릭**: 비밀번호 변경 페이지로 이동
2. **"무시" 클릭**: 경고를 무시하고 계속 진행 (비권장)
3. **비밀번호 변경**: 더 강력한 비밀번호로 변경

### 2.4 애플리케이션 레벨 처리

현재 애플리케이션에서는:

- 초기 비밀번호(0000) 사용 시 자동으로 비밀번호 변경 페이지로 리다이렉트
- 비밀번호 변경 강제 기능 구현
- 비밀번호 유효성 검사 (최소 6자)

## 3. 보안 권장사항

### 3.1 비밀번호 요구사항

강력한 비밀번호를 위해 다음을 권장합니다:

- **최소 8자 이상**
- **대문자, 소문자, 숫자, 특수문자 포함**
- **일반적인 단어나 패턴 피하기**
- **정기적인 비밀번호 변경** (90일마다 권장)

### 3.2 초기 비밀번호 설정 가이드

초기 관리자 계정 생성 시:

1. **복잡한 비밀번호 사용**:
   ```
   예시: Admin@Academy2024!
   ```

2. **Supabase Dashboard에서 직접 설정**:
   - Authentication > Users > Add user
   - 강력한 비밀번호 설정
   - Auto Confirm User 체크

3. **첫 로그인 시 비밀번호 변경 강제**:
   - 현재 구현됨
   - 초기 비밀번호 사용 시 자동 리다이렉트

### 3.3 추가 보안 조치

1. **2단계 인증 (2FA)**:
   - Supabase에서 지원 (향후 구현 가능)
   - SMS 또는 Authenticator 앱 사용

2. **세션 관리**:
   - 자동 로그아웃 설정
   - 세션 타임아웃 설정

3. **로그 모니터링**:
   - 로그인 시도 추적
   - 비정상적인 접근 감지

## 4. Chrome 경고 해결 단계

### 단계 1: 현재 상황 확인

1. Chrome에서 경고 메시지 확인
2. 경고 유형 파악:
   - "비밀번호가 유출되었습니다"
   - "비밀번호가 약합니다"
   - "비밀번호를 재사용하고 있습니다"

### 단계 2: 비밀번호 변경

1. 로그인 페이지에서 로그인 시도
2. 경고 표시 시 "비밀번호 변경" 클릭
3. 또는 `/profile/change-password` 직접 접속
4. 강력한 새 비밀번호 설정

### 단계 3: 확인

1. 새 비밀번호로 로그인 테스트
2. Chrome 경고가 사라졌는지 확인
3. 정상적으로 로그인되는지 확인

## 5. Supabase 설정 확인

### 5.1 Authentication 설정 확인

Supabase Dashboard에서 확인할 사항:

1. **Authentication** > **Settings**:
   - Password Policy 설정
   - Email Confirmation 필요 여부
   - Session Timeout 설정

2. **Authentication** > **Users**:
   - 사용자 목록 확인
   - 비밀번호 재설정 옵션

### 5.2 RLS (Row Level Security) 정책

현재 RLS 정책은 개발 단계로 모든 사용자가 접근 가능합니다.
프로덕션 환경에서는 더 엄격한 정책이 필요합니다.

## 6. 문제 해결 체크리스트

- [ ] 초기 비밀번호가 `0000`인지 확인
- [ ] Chrome 브라우저를 최신 버전으로 업데이트
- [ ] 비밀번호 변경 페이지에서 새 비밀번호 설정
- [ ] 새 비밀번호가 최소 8자 이상인지 확인
- [ ] 새 비밀번호에 대문자, 소문자, 숫자, 특수문자 포함 여부 확인
- [ ] Supabase Dashboard에서 비밀번호 정책 확인
- [ ] 로그인 후 정상 작동 확인

## 7. 참고 자료

- [Supabase Authentication 문서](https://supabase.com/docs/guides/auth)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Chrome Password Manager](https://support.google.com/chrome/answer/95606)
- [Have I Been Pwned](https://haveibeenpwned.com/)

