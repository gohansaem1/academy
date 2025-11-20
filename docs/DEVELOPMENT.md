# 개발 계획서

## 1. 프로젝트 목표

학원 운영에 필요한 모든 기능을 통합하여 효율적인 학원 관리 시스템을 구축합니다.

## 2. 프로젝트 범위

### 2.1 핵심 기능 (현재 구현 완료)

#### 학생 관리 모듈 ✅
- 학생 등록/수정/삭제
- 학생 정보 조회 (이름, 연락처, 주소, 보호자 정보 등)
- 학생별 수강 과목 및 이력 관리
- 학생 검색 및 필터링
- 학생 상세 정보에서 학습일지 조회

#### 강사 관리 모듈 ✅
- 강사 등록/수정/삭제
- 강사 정보 조회 (이름, 연락처, 담당 과목 등)
- 강사별 수업 스케줄 관리

#### 수업 관리 모듈 ✅
- 수업 등록/수정/삭제
- 수업 정보 관리 (과목명, 강사, 시간, 정원 등)
- 수업별 학생 등록 관리
- 시간표 조회 및 관리
- 학습일지 작성 기능

#### 출석 관리 모듈 ✅
- 출석 체크 (출석/지각/결석)
- 출석 기록 조회
- 출석 통계 (개인별, 수업별)
- 출석 이력 관리

#### 수강료 관리 모듈 ✅
- 수강료 입금 확인 및 기록
- 입금 이력 조회
- 미납 학생 관리
- 수강료 통계
- 결제 안내 문자 발송 기능

### 2.2 추가 기능 (향후 개발)

#### 회원 관리 및 인증 🔄
- 사용자 가입/로그인 (ID/Password + 선택적 OAuth)
- 역할(Role) 기반 접근 제어: STUDENT, PARENT, TEACHER, ADMIN
- 학부모-학생 계정 연결 관계
- 사용자 상태 관리 (active/inactive)

#### 학습일지 관리 🔄
- 수업별 학습일지 작성 (강사)
- 학습일지 조회 (학생 상세보기에서 확인)
- 학습 내용, 숙제, 특이사항 기록

#### 공지사항 및 메시지 🔄
- 공지사항 게시판
- 학부모-강사 1:1 메시지
- 수업별 그룹 알림
- 실시간 알림 (WebSocket)

#### 리포트 및 분석 🔄
- 학생별 학습 리포트 생성
- 출석률 통계
- 학습일지 요약 리포트
- 월간 리포트 PDF 생성

#### 관리자 대시보드 🔄
- 학원 전체 운영 데이터 시각화
- 월별 수익 분석
- 수강생 증감 분석
- 강의 수요 분석

#### 문자 발송 기능 🔄
- 결제 안내 문자 발송
- 출석 알림 문자 발송
- 공지사항 문자 발송
- SMS API 연동 (예: 알리고, 카카오톡 비즈메시지)

## 3. 기술 스택

### 프론트엔드
- **Next.js 16**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안정성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React 19**: 최신 React 기능 활용

### 백엔드
- **Next.js API Routes**: 서버 사이드 API
- **Supabase**: PostgreSQL 기반 백엔드 서비스
  - 데이터베이스: PostgreSQL
  - 인증: Supabase Auth (향후 구현)
  - 실시간 기능: Supabase Realtime (메시지/알림용)
- **Supabase Client**: `@supabase/supabase-js`를 통한 데이터베이스 접근

### 외부 서비스 (향후)
- **SMS API**: 문자 발송 서비스 (알리고, 카카오톡 비즈메시지 등)
- **OAuth**: 소셜 로그인 (Google, Kakao 등)

### 개발 도구
- **ESLint**: 코드 품질 관리
- **Git**: 버전 관리

## 4. 개발 단계

### Phase 1: 기초 설정 및 UI 구성 ✅ (100% 완료)
- [x] 프로젝트 초기 설정
- [x] 개발 문서 작성
- [x] 기본 레이아웃 구성 (Header, Footer)
- [x] 네비게이션 구조 설계
- [x] 공통 UI 컴포넌트 개발 (Button, Input, Table, Modal)
- [x] Supabase 연동 설정
- [x] 환경 변수 설정

### Phase 2: 학생 관리 기능 ✅ (100% 완료)
- [x] 학생 등록 폼 개발 (`/students/new`)
- [x] 학생 목록 페이지 개발 (`/students`) - 검색 기능 포함
- [x] 학생 상세 정보 페이지 개발 (`/students/[id]`)
- [x] 학생 정보 수정 페이지 개발 (`/students/[id]/edit`)
- [x] 학생 삭제 기능 구현
- [x] 학생 검색 기능 구현 (이름, 전화번호)
- [x] 폼 유효성 검사 구현

### Phase 3: 강사 관리 기능 ✅ (100% 완료)
- [x] 강사 등록 폼 개발 (`/instructors/new`)
- [x] 강사 목록 페이지 개발 (`/instructors`) - 검색 기능 포함
- [x] 강사 상세 정보 페이지 개발 (`/instructors/[id]`)
- [x] 강사 정보 수정 페이지 개발 (`/instructors/[id]/edit`)
- [x] 강사 삭제 기능 구현
- [x] 강사별 담당 수업 수 표시
- [x] 폼 유효성 검사 구현

### Phase 4: 수업 관리 기능 ✅ (100% 완료)
- [x] 수업 등록 폼 개발 (`/courses/new`)
- [x] 수업 목록 및 시간표 페이지 개발 (`/courses`) - 검색 기능 포함
- [x] 수업 상세 정보 페이지 개발 (`/courses/[id]`)
- [x] 수업 정보 수정 페이지 개발 (`/courses/[id]/edit`)
- [x] 수업별 학생 등록 기능 구현 (`/courses/[id]/enroll`)
- [x] 수업별 학생 제외 기능 구현
- [x] 수업 삭제 기능 구현
- [x] 수업별 등록 학생 수 표시
- [x] 강사 선택 드롭다운 연동
- [x] 폼 유효성 검사 구현

### Phase 5: 출석 관리 기능 ✅ (90% 완료)
- [x] 출석 체크 기능 개발 (`/attendance/new`)
- [x] 출석 기록 조회 페이지 개발 (`/attendance`) - 날짜별 필터링
- [x] 출석 상태 변경 기능 구현 (출석/지각/결석/조퇴)
- [x] 수업별 학생 자동 필터링
- [x] 출석 통계 기능 구현 (`/attendance/statistics`) - 개인별, 수업별 통계
- [x] 조퇴(early) 상태 추가
- [ ] 출석 알림 기능 (학부모 알림)

### Phase 6: 수강료 관리 기능 ✅ (90% 완료)
- [x] 수강료 입금 기록 등록 기능 개발 (`/payments/new`)
- [x] 입금 이력 조회 페이지 개발 (`/payments`) - 검색 기능 포함
- [x] 입금 상태 관리 (pending, confirmed, cancelled)
- [x] 총 수납액 통계 표시 (confirmed 상태 포함)
- [x] 결제 취소 기능 구현
- [x] 입금 확인 기능 (관리자 확인 프로세스)
- [ ] 결제 안내 문자 발송 기능
- [ ] 미납 자동 알림 기능

### Phase 7: 학습일지 기능 ✅ (완료)
- [x] 학습일지 작성 기능 개발 (`/learning-logs/new`)
- [x] 학습일지 조회 기능 (학생 상세보기)
- [x] 학습일지 조회 기능 (수업 상세보기)
- [x] 학습일지 수정 기능 (`/learning-logs/[id]/edit`)
- [x] 학습일지 삭제 기능

### Phase 8: 회원 인증 및 권한 관리 ✅ (80% 완료)
- [x] 사용자 가입/로그인 기능 (`/auth/register`, `/auth/login`)
- [x] 기본 인증 시스템 구현 (Supabase Auth 연동)
- [x] 사용자 정보 관리 (users 테이블)
- [x] 세션 관리 (localStorage 기반)
- [x] 역할 기반 접근 제어 구현 (페이지별 권한 체크)
- [x] 보호된 라우트 구현 (미인증 사용자 리다이렉트)
- [x] 역할별 메뉴 표시 (Header 컴포넌트)
- [x] 홈페이지 로그인 체크 및 역할별 대시보드
- [ ] 학부모-학생 계정 연결 기능 (`/relations/parent-child`)
- [ ] 역할별 세부 권한 정책 (예: 강사는 자신의 수업만 수정 가능)

### Phase 9: 공지사항 및 메시지 🔄
- [ ] 공지사항 게시판 개발
- [ ] 1:1 메시지 기능 개발
- [ ] 실시간 알림 기능 (WebSocket)
- [ ] 수업별 그룹 알림

### Phase 10: 리포트 및 분석 🔄
- [ ] 학생별 학습 리포트 생성
- [ ] 출석률 통계 대시보드
- [ ] 월간 리포트 PDF 생성
- [ ] 관리자 대시보드 개발

### Phase 11: 문자 발송 연동 🔄
- [ ] SMS API 연동
- [ ] 결제 안내 문자 발송
- [ ] 출석 알림 문자 발송
- [ ] 공지사항 문자 발송

## 5. 데이터 모델 설계

### 사용자 (User) - 향후 구현
```typescript
{
  id: string;
  name: string;
  role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
  phone: string;
  email: string;
  password: string; // 해시화된 비밀번호
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### 학부모-학생 관계 (ParentChild) - 향후 구현
```typescript
{
  id: string;
  parentId: string; // User ID (role: PARENT)
  studentId: string; // User ID (role: STUDENT)
  createdAt: Date;
}
```

### 학생 (Student) ✅
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

### 강사 (Instructor) ✅
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

### 수업 (Course) ✅
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

### 출석 (Attendance) ✅
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  date: Date;
  status: 'present' | 'late' | 'absent' | 'early'; // early 추가 예정
  timestamp?: Date; // 출석 체크 시간
  createdAt: Date;
}
```

### 학습일지 (LearningLog) - 향후 구현
```typescript
{
  id: string;
  courseId: string;
  date: Date; // 수업 날짜
  content: string; // 학습 내용
  homework?: string; // 숙제
  notes?: string; // 특이사항
  instructorId: string; // 작성자
  createdAt: Date;
  updatedAt: Date;
}
```

### 수강료 입금 (Payment) ✅
```typescript
{
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled'; // confirmed로 변경
  confirmedAt?: Date; // 입금 확인 시간
  confirmedBy?: string; // 확인자 ID
  smsSent: boolean; // 문자 발송 여부
  createdAt: Date;
}
```

### 공지사항 (Notice) - 향후 구현
```typescript
{
  id: string;
  title: string;
  content: string;
  targetRoles: string[]; // ['STUDENT', 'PARENT', 'TEACHER']
  targetCourses?: string[]; // 특정 수업 대상
  authorId: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 메시지 (Message) - 향후 구현
```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: Date;
}
```

### 리포트 (Report) - 향후 구현
```typescript
{
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  attendanceRate: number;
  learningLogCount: number;
  averageAttendance: number;
  createdAt: Date;
}
```

## 6. UI/UX 설계 원칙

- **직관적인 네비게이션**: 사용자가 쉽게 원하는 기능에 접근할 수 있도록
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **일관된 디자인 시스템**: 색상, 타이포그래피, 간격 등 일관성 유지
- **접근성 고려**: 키보드 네비게이션, 스크린 리더 지원
- **역할별 맞춤 UI**: 학생, 학부모, 강사, 관리자별 최적화된 인터페이스

## 7. 성능 목표

- 초기 로딩 시간: 3초 이내
- 페이지 전환 속도: 1초 이내
- API 응답 시간: 500ms 이내
- 실시간 메시지 지연: 1초 이내

## 8. 보안 고려사항

- 사용자 인증 및 권한 관리 (JWT 기반)
- 역할 기반 접근 제어 (RBAC)
- 입력 데이터 검증 및 sanitization
- SQL Injection 방지 (Supabase 자동 처리)
- XSS 공격 방지
- CSRF 토큰 사용
- 비밀번호 해시화 (bcrypt)
- 환경 변수를 통한 민감 정보 관리

## 9. 일정 계획

### 완료된 단계 ✅
- **1주차**: 프로젝트 설정 및 문서 작성 ✅
- **2-3주차**: 학생 관리 기능 개발 ✅
- **4-5주차**: 강사 및 수업 관리 기능 개발 ✅
- **6-7주차**: 출석 및 수강료 관리 기능 개발 ✅ (80% 완료)
- **현재**: 초기 버전 완성, 문서 업데이트 완료 ✅

### 진행 중 🔄
- 출석 통계 기능 개선
- 입금 확인 프로세스 개선

### 향후 계획 🔄
- **8주차**: 학습일지 기능 개발
- **9주차**: 회원 인증 및 권한 관리
- **10주차**: 공지사항 및 메시지 기능
- **11주차**: 리포트 및 대시보드 개발
- **12주차**: 문자 발송 연동 및 최종 테스트
- **13주차**: 배포 및 문서화

### 진행률 요약
- **Phase 1-4**: 100% 완료 ✅
- **Phase 5**: 80% 완료 🔄
- **Phase 6**: 80% 완료 🔄
- **Phase 7-11**: 0% (향후 개발 예정) 📋

## 10. 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)

