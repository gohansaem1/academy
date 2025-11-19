# 배포 가이드

## Vercel 배포

이 프로젝트는 Vercel을 통해 배포할 수 있습니다.

## 1. 사전 준비사항

### 1.1 필요한 계정
- [Vercel 계정](https://vercel.com) (GitHub 계정으로 가입 가능)
- [Supabase 계정](https://supabase.com) (이미 설정됨)

### 1.2 GitHub 저장소 확인
- 프로젝트가 GitHub에 푸시되어 있어야 합니다
- 저장소: `https://github.com/gohansaem1/academy.git`

## 2. Vercel 배포 단계

### 2.1 Vercel에 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **Add New...** → **Project** 클릭
3. **Import Git Repository**에서 GitHub 저장소 선택
4. 저장소 `gohansaem1/academy` 선택 후 **Import** 클릭

### 2.2 프로젝트 설정

#### 기본 설정
- **Framework Preset**: Next.js (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

#### 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수를 추가합니다:

| 이름 | 값 | 설명 |
|------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krcncyrwiirgfvzsqpjy.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Anon Key |

**환경 변수 추가 방법:**
1. **Environment Variables** 섹션 클릭
2. **Name**에 변수명 입력
3. **Value**에 값 입력
4. **Environment**는 모두 선택 (Production, Preview, Development)
5. **Add** 클릭
6. 두 번째 환경 변수도 동일하게 추가

### 2.3 배포 실행

1. 모든 설정이 완료되면 **Deploy** 버튼 클릭
2. 빌드가 시작되고 완료될 때까지 대기 (약 1-2분)
3. 배포가 완료되면 배포 URL이 생성됩니다

## 3. 배포 후 확인사항

### 3.1 배포 URL 확인
- 배포가 완료되면 `https://academy-xxx.vercel.app` 형식의 URL이 생성됩니다
- 이 URL로 애플리케이션에 접속할 수 있습니다

### 3.2 기능 테스트
배포된 사이트에서 다음 기능들을 테스트하세요:
- [ ] 학생 관리 기능
- [ ] 강사 관리 기능
- [ ] 수업 관리 기능
- [ ] 출석 관리 기능
- [ ] 수강료 관리 기능

### 3.3 Supabase 연결 확인
- Supabase 대시보드에서 데이터베이스 테이블이 생성되어 있는지 확인
- 배포된 사이트에서 데이터 조회/등록이 정상 작동하는지 확인

## 4. 커스텀 도메인 설정 (선택사항)

### 4.1 도메인 추가
1. Vercel 프로젝트 설정에서 **Domains** 탭 클릭
2. 원하는 도메인 입력
3. Vercel이 제공하는 DNS 설정을 도메인 제공업체에 추가
4. DNS 전파 완료 후 도메인 연결 확인

## 5. 환경별 배포

### 5.1 Production 배포
- `main` 또는 `master` 브랜치에 푸시하면 자동으로 Production 배포가 실행됩니다

### 5.2 Preview 배포
- 다른 브랜치에 푸시하면 Preview 배포가 자동으로 생성됩니다
- Pull Request 생성 시에도 Preview 배포가 생성됩니다

## 6. 환경 변수 관리

### 6.1 프로덕션 환경 변수
- Vercel Dashboard → 프로젝트 → Settings → Environment Variables
- Production 환경에만 적용할 변수는 **Production**만 선택

### 6.2 환경 변수 업데이트
- 환경 변수를 변경한 후에는 **Redeploy**가 필요합니다
- Settings → Environment Variables에서 수정 후 **Redeploy** 클릭

## 7. 빌드 및 배포 로그 확인

### 7.1 배포 로그
- Vercel Dashboard → 프로젝트 → Deployments
- 각 배포의 로그를 확인할 수 있습니다

### 7.2 빌드 오류 해결
- 빌드 오류가 발생하면 로그를 확인하여 문제를 해결하세요
- 일반적인 오류:
  - 환경 변수 누락
  - 의존성 설치 실패
  - 빌드 타임아웃

## 8. 성능 최적화

### 8.1 자동 최적화
- Vercel은 Next.js를 자동으로 최적화합니다
- 이미지 최적화, 코드 스플리팅 등이 자동으로 적용됩니다

### 8.2 성능 모니터링
- Vercel Dashboard → 프로젝트 → Analytics
- 페이지 로드 시간, 요청 수 등을 확인할 수 있습니다

## 9. 롤백

### 9.1 이전 버전으로 롤백
1. Vercel Dashboard → 프로젝트 → Deployments
2. 롤백하고 싶은 배포를 찾아 **...** 메뉴 클릭
3. **Promote to Production** 클릭

## 10. 문제 해결

### 10.1 빌드 실패
- 환경 변수가 올바르게 설정되었는지 확인
- `package.json`의 빌드 스크립트 확인
- 로컬에서 `npm run build`가 성공하는지 확인

### 10.2 런타임 오류
- 브라우저 콘솔에서 오류 확인
- Vercel Function Logs에서 서버 사이드 오류 확인
- Supabase 연결 상태 확인

### 10.3 환경 변수 오류
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
- 환경 변수가 올바른 환경에 설정되었는지 확인

## 11. CI/CD 파이프라인

### 11.1 자동 배포
- GitHub에 푸시하면 자동으로 배포가 시작됩니다
- `main`/`master` 브랜치 → Production 배포
- 다른 브랜치 → Preview 배포

### 11.2 배포 알림
- Vercel Dashboard → 프로젝트 → Settings → Notifications
- 배포 완료 알림을 이메일이나 Slack으로 받을 수 있습니다

## 12. 보안 고려사항

### 12.1 환경 변수 보안
- 민감한 정보는 환경 변수로 관리
- 환경 변수는 Vercel Dashboard에서만 관리
- Git에 커밋하지 않도록 주의

### 12.2 Supabase RLS
- 프로덕션 환경에서는 Row Level Security (RLS) 정책을 적절히 설정하세요
- 현재는 개발용으로 모든 사용자가 접근 가능하도록 설정되어 있습니다

## 13. 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 공식 문서](https://supabase.com/docs)

## 14. 체크리스트

배포 전 확인사항:
- [ ] GitHub 저장소에 코드가 푸시되어 있음
- [ ] Supabase 프로젝트가 설정되어 있음
- [ ] Supabase 데이터베이스 테이블이 생성되어 있음
- [ ] 환경 변수가 Vercel에 설정되어 있음
- [ ] 로컬에서 `npm run build`가 성공함
- [ ] 로컬에서 애플리케이션이 정상 작동함

