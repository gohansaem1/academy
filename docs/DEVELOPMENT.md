# 개발 계획서

## 1. 프로젝트 목표

학원 운영에 필요한 모든 기능을 통합하여 효율적인 학원 관리 시스템을 구축합니다.

## 2. 프로젝트 범위

### 2.1 핵심 기능

#### 학생 관리 모듈
- 학생 등록/수정/삭제
- 학생 정보 조회 (이름, 연락처, 주소, 보호자 정보 등)
- 학생별 수강 과목 및 이력 관리
- 학생 검색 및 필터링

#### 강사 관리 모듈
- 강사 등록/수정/삭제
- 강사 정보 조회 (이름, 연락처, 담당 과목 등)
- 강사별 수업 스케줄 관리

#### 수업 관리 모듈
- 수업 등록/수정/삭제
- 수업 정보 관리 (과목명, 강사, 시간, 정원 등)
- 수업별 학생 등록 관리
- 시간표 조회 및 관리

#### 출석 관리 모듈
- 출석 체크 (출석/지각/결석)
- 출석 기록 조회
- 출석 통계 (개인별, 수업별)
- 출석 이력 관리

#### 수강료 관리 모듈
- 수강료 결제 처리
- 결제 방법 관리 (현금, 카드, 계좌이체 등)
- 결제 이력 조회
- 미납 학생 관리
- 수강료 통계

### 2.2 추가 기능 (향후 개발)

- 대시보드 (통계 및 요약 정보)
- 알림 기능 (결제 알림, 출석 알림 등)
- 리포트 생성 (출석률, 수강료 수납률 등)
- 사용자 권한 관리 (관리자, 강사, 학생)
- 공지사항 관리

## 3. 기술 스택

### 프론트엔드
- **Next.js 16**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안정성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React 19**: 최신 React 기능 활용

### 백엔드 (향후 계획)
- **Next.js API Routes**: 서버 사이드 API
- **데이터베이스**: PostgreSQL 또는 MySQL (예정)
- **인증**: NextAuth.js 또는 JWT (예정)

### 개발 도구
- **ESLint**: 코드 품질 관리
- **Git**: 버전 관리

## 4. 개발 단계

### Phase 1: 기초 설정 및 UI 구성 (현재 단계)
- [x] 프로젝트 초기 설정
- [x] 개발 문서 작성
- [ ] 기본 레이아웃 구성
- [ ] 네비게이션 구조 설계

### Phase 2: 학생 관리 기능
- [ ] 학생 등록 폼 개발
- [ ] 학생 목록 페이지 개발
- [ ] 학생 상세 정보 페이지 개발
- [ ] 학생 검색 기능 구현

### Phase 3: 강사 관리 기능
- [ ] 강사 등록 폼 개발
- [ ] 강사 목록 페이지 개발
- [ ] 강사 상세 정보 페이지 개발

### Phase 4: 수업 관리 기능
- [ ] 수업 등록 폼 개발
- [ ] 수업 목록 및 시간표 페이지 개발
- [ ] 수업별 학생 등록 기능 구현

### Phase 5: 출석 관리 기능
- [ ] 출석 체크 기능 개발
- [ ] 출석 기록 조회 페이지 개발
- [ ] 출석 통계 기능 구현

### Phase 6: 수강료 관리 기능
- [ ] 수강료 결제 처리 기능 개발
- [ ] 결제 이력 조회 페이지 개발
- [ ] 미납 관리 기능 구현

### Phase 7: 백엔드 연동
- [ ] 데이터베이스 설계 및 구축
- [ ] API 엔드포인트 개발
- [ ] 프론트엔드-백엔드 연동

### Phase 8: 테스트 및 배포
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 수행
- [ ] 프로덕션 배포

## 5. 데이터 모델 설계

### 학생 (Student)
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  guardianName: string;
  guardianPhone: string;
  enrolledCourses: string[]; // 수업 ID 배열
  createdAt: Date;
  updatedAt: Date;
}
```

### 강사 (Instructor)
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string; // 담당 과목
  courses: string[]; // 담당 수업 ID 배열
  createdAt: Date;
  updatedAt: Date;
}
```

### 수업 (Course)
```typescript
{
  id: string;
  name: string; // 수업명
  subject: string; // 과목명
  instructorId: string;
  schedule: {
    dayOfWeek: number; // 0-6 (일-토)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  capacity: number; // 정원
  enrolledStudents: string[]; // 학생 ID 배열
  tuitionFee: number; // 수강료
  createdAt: Date;
  updatedAt: Date;
}
```

### 출석 (Attendance)
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  date: Date;
  status: 'present' | 'late' | 'absent';
  createdAt: Date;
}
```

### 결제 (Payment)
```typescript
{
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentDate: Date;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: Date;
}
```

## 6. UI/UX 설계 원칙

- **직관적인 네비게이션**: 사용자가 쉽게 원하는 기능에 접근할 수 있도록
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **일관된 디자인 시스템**: 색상, 타이포그래피, 간격 등 일관성 유지
- **접근성 고려**: 키보드 네비게이션, 스크린 리더 지원

## 7. 성능 목표

- 초기 로딩 시간: 3초 이내
- 페이지 전환 속도: 1초 이내
- API 응답 시간: 500ms 이내

## 8. 보안 고려사항

- 사용자 인증 및 권한 관리
- 입력 데이터 검증 및 sanitization
- SQL Injection 방지
- XSS 공격 방지
- CSRF 토큰 사용

## 9. 일정 계획

- **1주차**: 프로젝트 설정 및 문서 작성
- **2-3주차**: 학생 관리 기능 개발
- **4-5주차**: 강사 및 수업 관리 기능 개발
- **6-7주차**: 출석 및 수강료 관리 기능 개발
- **8주차**: 백엔드 연동 및 테스트
- **9주차**: 배포 및 문서화

## 10. 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

