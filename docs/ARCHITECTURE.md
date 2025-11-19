# 아키텍처 설계 문서

## 1. 시스템 아키텍처 개요

학원 관리 시스템은 Next.js 기반의 풀스택 웹 애플리케이션으로 설계됩니다.

```
┌─────────────────────────────────────────┐
│         클라이언트 (브라우저)            │
│  ┌───────────────────────────────────┐  │
│  │      React Components (UI)        │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │ HTTP/HTTPS
┌─────────────────▼───────────────────────┐
│      Next.js Application Server         │
│  ┌───────────────────────────────────┐  │
│  │   API Routes (Server Actions)     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Business Logic Layer            │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Supabase (PostgreSQL)            │
│  ┌───────────────────────────────────┐  │
│  │   Supabase Client                │  │
│  │   - Authentication               │  │
│  │   - Database                     │  │
│  │   - Storage                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 2. 디렉토리 구조

```
academy/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   ├── page.tsx                 # 홈 페이지
│   │   ├── students/                # 학생 관리 페이지
│   │   │   ├── page.tsx            # 학생 목록
│   │   │   ├── [id]/               # 학생 상세
│   │   │   │   └── page.tsx
│   │   │   └── new/                # 학생 등록
│   │   │       └── page.tsx
│   │   ├── instructors/             # 강사 관리 페이지
│   │   ├── courses/                 # 수업 관리 페이지
│   │   ├── attendance/              # 출석 관리 페이지
│   │   ├── payments/                # 수강료 관리 페이지
│   │   └── api/                     # API Routes
│   │       ├── students/
│   │       ├── instructors/
│   │       ├── courses/
│   │       ├── attendance/
│   │       └── payments/
│   ├── components/                   # 재사용 가능한 컴포넌트
│   │   ├── common/                  # 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/                  # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── features/                # 기능별 컴포넌트
│   │       ├── students/
│   │       ├── instructors/
│   │       ├── courses/
│   │       ├── attendance/
│   │       └── payments/
│   ├── lib/                         # 유틸리티 및 헬퍼 함수
│   │   ├── supabase/               # Supabase 클라이언트
│   │   │   ├── client.ts          # 클라이언트 컴포넌트용
│   │   │   └── server.ts          # 서버 컴포넌트용
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── types/                       # TypeScript 타입 정의
│   │   ├── student.ts
│   │   ├── instructor.ts
│   │   ├── course.ts
│   │   ├── attendance.ts
│   │   └── payment.ts
│   └── hooks/                       # 커스텀 React Hooks
│       ├── useStudents.ts
│       ├── useInstructors.ts
│       └── useCourses.ts
├── public/                          # 정적 파일
├── docs/                            # 개발 문서
└── tests/                           # 테스트 파일
```

## 3. 컴포넌트 아키텍처

### 3.1 컴포넌트 계층 구조

```
Page Component (app/students/page.tsx)
    ↓
Feature Component (components/features/students/StudentList.tsx)
    ↓
Common Components (components/common/Table.tsx, Button.tsx 등)
```

### 3.2 컴포넌트 설계 원칙

- **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 역할만 수행
- **재사용성**: 공통 컴포넌트는 최대한 재사용 가능하도록 설계
- **Props 타입 정의**: 모든 컴포넌트의 props는 TypeScript로 타입 정의
- **컴포넌트 분리**: 큰 컴포넌트는 작은 단위로 분리

## 4. 상태 관리

### 4.1 상태 관리 전략

현재 단계에서는 React의 기본 상태 관리 기능을 사용:
- **useState**: 컴포넌트 내부 상태 관리
- **useContext**: 전역 상태 공유 (필요시)

향후 복잡도가 증가하면 다음을 고려:
- **Zustand** 또는 **Jotai**: 경량 상태 관리 라이브러리
- **React Query**: 서버 상태 관리

### 4.2 상태 구조

```typescript
// 전역 상태 예시 (향후 구현)
interface AppState {
  students: Student[];
  instructors: Instructor[];
  courses: Course[];
  currentUser: User | null;
}
```

## 5. 데이터 흐름

### 5.1 데이터 페칭 흐름

```
Component
  ↓
useEffect / Server Component
  ↓
Supabase Client (lib/supabase/client.ts 또는 server.ts)
  ↓
Supabase API
  ↓
PostgreSQL Database (Supabase)
  ↓
Response
  ↓
Component State Update
```

또는 Next.js API Routes를 통한 경우:

```
Component
  ↓
API Route (app/api/students/route.ts)
  ↓
Supabase Client (lib/supabase/server.ts)
  ↓
Supabase API
  ↓
PostgreSQL Database (Supabase)
  ↓
Response
  ↓
Component State Update
```

### 5.2 Server Components vs Client Components

- **Server Components**: 기본적으로 모든 컴포넌트는 Server Component
- **Client Components**: 인터랙티브 기능이 필요한 경우에만 'use client' 사용

## 6. API 설계

### 6.1 RESTful API 원칙

- **GET**: 리소스 조회
- **POST**: 리소스 생성
- **PUT/PATCH**: 리소스 수정
- **DELETE**: 리소스 삭제

### 6.2 API 엔드포인트 구조

```
/api/students          # 학생 목록 조회, 생성
/api/students/[id]     # 학생 상세 조회, 수정, 삭제
/api/instructors       # 강사 목록 조회, 생성
/api/instructors/[id]  # 강사 상세 조회, 수정, 삭제
/api/courses           # 수업 목록 조회, 생성
/api/courses/[id]      # 수업 상세 조회, 수정, 삭제
/api/attendance        # 출석 기록 조회, 생성
/api/payments          # 결제 이력 조회, 생성
```

## 7. 스타일링 아키텍처

### 7.1 Tailwind CSS 사용

- 유틸리티 클래스를 통한 스타일링
- 컴포넌트별 스타일은 해당 컴포넌트 파일 내에서 관리
- 공통 스타일은 `globals.css`에서 관리

### 7.2 디자인 시스템

```typescript
// 색상 팔레트 (예시)
const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    // ...
  }
};
```

## 8. 에러 처리

### 8.1 에러 처리 전략

- **API 에러**: try-catch로 처리하고 사용자에게 적절한 메시지 표시
- **폼 검증 에러**: 실시간 검증 및 에러 메시지 표시
- **전역 에러**: Error Boundary로 처리

### 8.2 에러 타입 정의

```typescript
interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}
```

## 9. 성능 최적화

### 9.1 최적화 전략

- **코드 스플리팅**: Next.js 자동 코드 스플리팅 활용
- **이미지 최적화**: next/image 컴포넌트 사용
- **폰트 최적화**: next/font 사용
- **캐싱**: API 응답 캐싱 (향후)
- **메모이제이션**: React.memo, useMemo, useCallback 활용

### 9.2 번들 크기 최적화

- 필요한 라이브러리만 import
- Tree-shaking 활용
- 동적 import 사용

## 10. 보안 아키텍처

### 10.1 보안 계층

1. **인증**: 사용자 인증 (향후 구현)
2. **인가**: 권한 기반 접근 제어
3. **입력 검증**: 클라이언트 및 서버 측 검증
4. **데이터 암호화**: HTTPS, 민감 정보 암호화

### 10.2 보안 모범 사례

- 환경 변수로 민감 정보 관리
- SQL Injection 방지
- XSS 공격 방지
- CSRF 토큰 사용

## 11. 테스트 전략

### 11.1 테스트 계층

- **단위 테스트**: 개별 함수 및 컴포넌트 테스트
- **통합 테스트**: API 엔드포인트 테스트
- **E2E 테스트**: 사용자 시나리오 기반 테스트 (향후)

### 11.2 테스트 도구 (향후 도입)

- **Jest**: 단위 테스트 프레임워크
- **React Testing Library**: 컴포넌트 테스트
- **Playwright**: E2E 테스트

## 12. 배포 아키텍처

### 12.1 배포 전략

- **개발 환경**: 로컬 개발 서버
- **스테이징 환경**: Vercel Preview (향후)
- **프로덕션 환경**: Vercel 또는 자체 서버 (향후)

### 12.2 CI/CD 파이프라인 (향후)

```
Git Push
  ↓
GitHub Actions
  ↓
테스트 실행
  ↓
빌드
  ↓
배포
```

## 13. 확장성 고려사항

- 모듈화된 구조로 기능 추가 용이
- 컴포넌트 재사용성 극대화
- API 설계 시 확장 가능한 구조
- 데이터베이스 스키마 설계 시 확장성 고려

