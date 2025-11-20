# API 명세서

## 1. API 개요

학원 관리 시스템의 API 명세서입니다. 현재는 Supabase 클라이언트를 직접 사용하고 있으며, 향후 Next.js API Routes로 확장할 수 있습니다.

## 2. 공통 사항

### 2.1 현재 구현 방식

현재 프로젝트는 Supabase 클라이언트를 직접 사용하여 데이터베이스에 접근합니다:

```typescript
import { supabase } from '@/lib/supabase/client';

// 예시: 학생 목록 조회
const { data, error } = await supabase
  .from('students')
  .select('*');
```

### 2.2 향후 API Routes 구조

향후 Next.js API Routes로 확장할 경우:

```
개발 환경: http://localhost:3000/api
프로덕션: https://your-domain.com/api
```

### 2.3 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 2.4 HTTP 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

## 3. 학생 관리 API ✅

### 3.1 학생 목록 조회

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { data, error } = await supabase
  .from('students')
  .select('*')
  .order('created_at', { ascending: false });
```

**향후 API**: `GET /api/students`

#### Query Parameters
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10)
- `search` (optional): 검색어 (이름, 전화번호)

### 3.2 학생 상세 조회

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('id', studentId)
  .single();
```

**향후 API**: `GET /api/students/[id]`

### 3.3 학생 등록

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { error } = await supabase
  .from('students')
  .insert([{ name, phone, ... }]);
```

**향후 API**: `POST /api/students`

### 3.4 학생 정보 수정

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `PUT /api/students/[id]`

### 3.5 학생 삭제

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `DELETE /api/students/[id]`

## 4. 강사 관리 API ✅

### 4.1 강사 목록 조회

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `GET /api/instructors`

### 4.2 강사 등록

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `POST /api/instructors`

### 4.3 강사 정보 수정

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `PUT /api/instructors/[id]`

### 4.4 강사 삭제

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `DELETE /api/instructors/[id]`

## 5. 수업 관리 API ✅

### 5.1 수업 목록 조회

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `GET /api/courses`

### 5.2 수업 등록

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `POST /api/courses`

### 5.3 수업 정보 수정

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `PUT /api/courses/[id]`

### 5.4 학생 수업 등록

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { error } = await supabase
  .from('course_enrollments')
  .insert([{ course_id, student_id }]);
```

**향후 API**: `POST /api/courses/[id]/enroll`

### 5.5 학생 수업 취소

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `DELETE /api/courses/[id]/enroll?studentId={studentId}`

## 6. 출석 관리 API ✅

### 6.1 출석 기록 조회

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { data } = await supabase
  .from('attendance')
  .select('*')
  .eq('date', selectedDate);
```

**향후 API**: `GET /api/attendance`

#### Query Parameters
- `courseId` (optional): 수업 ID
- `studentId` (optional): 학생 ID
- `startDate` (optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (optional): 종료 날짜 (YYYY-MM-DD)

### 6.2 출석 체크

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { error } = await supabase
  .from('attendance')
  .insert([{
    course_id,
    student_id,
    date,
    status: 'present' | 'late' | 'absent'
  }]);
```

**향후 API**: `POST /api/attendance`

#### Request Body
```json
{
  "courseId": "course-001",
  "studentId": "student-001",
  "date": "2024-01-15",
  "status": "present"
}
```

#### Status 값
- `present`: 출석
- `late`: 지각
- `absent`: 결석
- `early`: 조퇴 (향후 추가 예정)

### 6.3 출석 상태 변경

**현재 구현**: Supabase 클라이언트 직접 사용

```typescript
const { error } = await supabase
  .from('attendance')
  .update({ status: newStatus })
  .eq('id', attendanceId);
```

**향후 API**: `PUT /api/attendance/[id]`

### 6.4 출석 통계 조회

**향후 API**: `GET /api/attendance/statistics`

#### Query Parameters
- `studentId` (optional): 학생 ID
- `courseId` (optional): 수업 ID
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "total": 30,
    "present": 25,
    "late": 3,
    "absent": 2,
    "early": 0,
    "attendanceRate": 83.3
  }
}
```

## 7. 수강료 관리 API ✅

### 7.1 입금 이력 조회

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `GET /api/payments`

#### Query Parameters
- `studentId` (optional): 학생 ID
- `courseId` (optional): 수업 ID
- `status` (optional): 입금 상태 (pending, confirmed, cancelled)
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment-001",
        "studentId": "student-001",
        "studentName": "홍길동",
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "amount": 100000,
        "paymentMethod": "transfer",
        "paymentDate": "2024-01-01",
        "status": "confirmed",
        "confirmedAt": "2024-01-01T10:00:00Z",
        "confirmedBy": "admin-001",
        "smsSent": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 7.2 입금 기록 등록

**현재 구현**: Supabase 클라이언트 직접 사용

**향후 API**: `POST /api/payments`

#### Request Body
```json
{
  "studentId": "student-001",
  "courseId": "course-001",
  "amount": 100000,
  "paymentMethod": "transfer",
  "paymentDate": "2024-01-01",
  "status": "pending"
}
```

#### Payment Method 값
- `cash`: 현금
- `card`: 카드
- `transfer`: 계좌이체

### 7.3 입금 확인

**향후 API**: `PUT /api/payments/[id]/confirm`

#### Request Body
```json
{
  "confirmedBy": "admin-001"
}
```

#### 응답 예시
```json
{
  "success": true,
  "message": "입금이 확인되었습니다."
}
```

### 7.4 결제 안내 문자 발송

**향후 API**: `POST /api/payments/[id]/send-sms`

#### Request Body
```json
{
  "message": "수강료 입금 안내 메시지 (선택사항)"
}
```

#### 응답 예시
```json
{
  "success": true,
  "message": "문자가 발송되었습니다.",
  "data": {
    "smsId": "sms-001",
    "sentAt": "2024-01-01T10:00:00Z"
  }
}
```

### 7.5 미납 조회

**향후 API**: `GET /api/payments/overdue`

#### Query Parameters
- `studentId` (optional): 학생 ID

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "overduePayments": [
      {
        "studentId": "student-001",
        "studentName": "홍길동",
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "amount": 100000,
        "dueDate": "2024-01-01",
        "daysOverdue": 15
      }
    ]
  }
}
```

## 8. 학습일지 관리 API 🔄

### 8.1 학습일지 작성

**향후 API**: `POST /api/learning-logs`

#### Request Body
```json
{
  "courseId": "course-001",
  "date": "2024-01-15",
  "content": "오늘은 함수의 개념을 배웠습니다.",
  "homework": "교과서 50-52페이지 문제 풀기",
  "notes": "홍길동 학생이 특히 잘 이해했습니다."
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "log-001",
    "courseId": "course-001",
    "date": "2024-01-15",
    "content": "오늘은 함수의 개념을 배웠습니다.",
    "homework": "교과서 50-52페이지 문제 풀기",
    "notes": "홍길동 학생이 특히 잘 이해했습니다.",
    "instructorId": "instructor-001",
    "createdAt": "2024-01-15T14:00:00Z"
  }
}
```

### 8.2 학습일지 조회 (수업별)

**향후 API**: `GET /api/learning-logs/course/[courseId]`

#### Query Parameters
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

### 8.3 학습일지 조회 (학생별)

**향후 API**: `GET /api/learning-logs/student/[studentId]`

학생 상세보기 페이지에서 해당 학생이 수강하는 수업의 학습일지를 조회합니다.

### 8.4 학습일지 수정

**향후 API**: `PUT /api/learning-logs/[id]`

### 8.5 학습일지 삭제

**향후 API**: `DELETE /api/learning-logs/[id]`

## 9. 회원 인증 및 권한 관리 API 🔄

### 9.1 회원 가입

**향후 API**: `POST /api/auth/register`

#### Request Body
```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "password": "password123",
  "role": "STUDENT"
}
```

#### Role 값
- `STUDENT`: 학생
- `PARENT`: 학부모
- `TEACHER`: 강사
- `ADMIN`: 관리자

### 9.2 로그인

**향후 API**: `POST /api/auth/login`

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-001",
      "email": "admin@example.com",
      "role": "ADMIN",
      "name": "관리자"
    }
  }
}
```

### 9.3 학부모-학생 연결

**향후 API**: `POST /api/relations/parent-child`

#### Request Body
```json
{
  "parentId": "user-001",
  "studentId": "user-002"
}
```

### 9.4 인증 헤더

인증이 필요한 API 요청 시 다음 헤더를 포함해야 합니다:

```
Authorization: Bearer {token}
```

## 10. 공지사항 관리 API 🔄

### 10.1 공지사항 목록 조회

**향후 API**: `GET /api/notices`

#### Query Parameters
- `targetRole` (optional): 대상 역할 필터
- `targetCourse` (optional): 대상 수업 필터
- `published` (optional): 발행 여부 (true/false)

### 10.2 공지사항 작성

**향후 API**: `POST /api/notices`

#### Request Body
```json
{
  "title": "월간 테스트 안내",
  "content": "다음 주 월요일 월간 테스트를 실시합니다.",
  "targetRoles": ["STUDENT", "PARENT"],
  "targetCourses": ["course-001"]
}
```

### 10.3 공지사항 수정

**향후 API**: `PUT /api/notices/[id]`

### 10.4 공지사항 삭제

**향후 API**: `DELETE /api/notices/[id]`

## 11. 메시지 관리 API 🔄

### 11.1 메시지 목록 조회

**향후 API**: `GET /api/messages`

#### Query Parameters
- `conversationWith` (optional): 대화 상대 ID

### 11.2 메시지 전송

**향후 API**: `POST /api/messages`

#### Request Body
```json
{
  "receiverId": "user-002",
  "text": "안녕하세요. 오늘 수업에 대해 문의드립니다."
}
```

### 11.3 메시지 읽음 처리

**향후 API**: `PUT /api/messages/[id]/read`

### 11.4 실시간 메시지 (WebSocket)

**향후 구현**: `WebSocket /ws/chat`

## 12. 리포트 및 분석 API 🔄

### 12.1 학생별 리포트 조회

**향후 API**: `GET /api/reports/student/[studentId]`

#### Query Parameters
- `month` (optional): 월 (YYYY-MM 형식)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "studentName": "홍길동",
    "month": "2024-01",
    "attendanceRate": 95.5,
    "learningLogCount": 12,
    "averageAttendance": 95.5,
    "courses": [
      {
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "attendanceRate": 100,
        "learningLogCount": 4
      }
    ]
  }
}
```

### 12.2 수업별 리포트 조회

**향후 API**: `GET /api/reports/course/[courseId]`

### 12.3 리포트 PDF 생성

**향후 API**: `GET /api/reports/student/[studentId]/pdf?month=2024-01`

## 13. 관리자 대시보드 및 경영자료 API 📊

### 13.1 대시보드 개요 데이터 조회

**향후 API**: `GET /api/admin/dashboard`

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 150,
      "totalInstructors": 10,
      "totalCourses": 25,
      "activeEnrollments": 320,
      "monthlyRevenue": 15000000,
      "monthlyRevenueGrowth": 5.2,
      "attendanceRate": 92.5,
      "attendanceRateGrowth": 2.1
    },
    "recentActivities": [
      {
        "type": "student_registered",
        "message": "홍길동 학생이 등록되었습니다.",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "quickStats": {
      "newStudentsThisMonth": 12,
      "newCoursesThisMonth": 3,
      "pendingPayments": 5,
      "lowAttendanceStudents": 8
    }
  }
}
```

### 13.2 수강생 현황 통계

**향후 API**: `GET /api/admin/statistics/students`

#### Query Parameters
- `startDate` (optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (optional): 종료 날짜 (YYYY-MM-DD)
- `groupBy` (optional): 그룹화 기준 (month, year, subject)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "total": 150,
    "newStudents": {
      "thisMonth": 12,
      "lastMonth": 10,
      "growth": 20.0
    },
    "dropoutStudents": {
      "thisMonth": 2,
      "lastMonth": 3,
      "dropoutRate": 1.3
    },
    "trend": [
      {
        "period": "2024-01",
        "new": 12,
        "dropout": 2,
        "net": 10
      }
    ],
    "distribution": {
      "bySubject": {
        "수학": 45,
        "영어": 38,
        "국어": 32
      },
      "byAge": {
        "초등": 60,
        "중등": 55,
        "고등": 35
      }
    },
    "averageCoursesPerStudent": 2.1
  }
}
```

### 13.3 수업 현황 통계

**향후 API**: `GET /api/admin/statistics/courses`

#### Query Parameters
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜
- `subject` (optional): 과목 필터

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "total": 25,
    "activeCourses": 23,
    "averageEnrollment": 13.6,
    "averageCapacity": 20,
    "enrollmentRate": 68.0,
    "bySubject": {
      "수학": {
        "count": 8,
        "totalEnrollment": 120,
        "averageEnrollment": 15.0
      }
    },
    "byDayOfWeek": {
      "월요일": 5,
      "화요일": 4,
      "수요일": 6
    },
    "byTimeSlot": {
      "09:00-12:00": 8,
      "13:00-16:00": 10,
      "16:00-19:00": 7
    },
    "popularCourses": [
      {
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "enrollment": 18,
        "capacity": 20,
        "enrollmentRate": 90.0
      }
    ]
  }
}
```

### 13.4 수강료 수납 통계

**향후 API**: `GET /api/admin/statistics/payments`

#### Query Parameters
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜
- `courseId` (optional): 수업 필터
- `groupBy` (optional): 그룹화 기준 (month, year, course)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000000,
    "thisMonth": {
      "revenue": 15000000,
      "lastMonth": 14200000,
      "growth": 5.6
    },
    "byMonth": [
      {
        "month": "2024-01",
        "revenue": 15000000,
        "paidCount": 120,
        "pendingCount": 5,
        "cancelledCount": 2
      }
    ],
    "byCourse": [
      {
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "revenue": 3600000,
        "paidCount": 18,
        "pendingCount": 2
      }
    ],
    "byPaymentMethod": {
      "cash": 6000000,
      "card": 5000000,
      "transfer": 4000000
    },
    "pendingPayments": {
      "count": 5,
      "totalAmount": 750000,
      "students": [
        {
          "studentId": "student-001",
          "studentName": "홍길동",
          "amount": 150000,
          "dueDate": "2024-01-20"
        }
      ]
    },
    "collectionRate": 96.0
  }
}
```

### 13.5 출석률 통계

**향후 API**: `GET /api/admin/statistics/attendance`

#### Query Parameters
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜
- `courseId` (optional): 수업 필터
- `studentId` (optional): 학생 필터

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "overall": {
      "attendanceRate": 92.5,
      "totalSessions": 500,
      "present": 450,
      "late": 25,
      "absent": 20,
      "early": 5
    },
    "byMonth": [
      {
        "month": "2024-01",
        "attendanceRate": 92.5,
        "totalSessions": 500,
        "present": 450,
        "late": 25,
        "absent": 20,
        "early": 5
      }
    ],
    "byCourse": [
      {
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "attendanceRate": 95.0,
        "totalSessions": 100,
        "present": 90,
        "late": 5,
        "absent": 5
      }
    ],
    "byStatus": {
      "present": 450,
      "late": 25,
      "absent": 20,
      "early": 5
    },
    "topStudents": [
      {
        "studentId": "student-001",
        "studentName": "홍길동",
        "attendanceRate": 100.0,
        "totalSessions": 20,
        "present": 20
      }
    ],
    "lowAttendanceStudents": [
      {
        "studentId": "student-002",
        "studentName": "김철수",
        "attendanceRate": 70.0,
        "totalSessions": 20,
        "present": 14,
        "absent": 6
      }
    ]
  }
}
```

### 13.6 강사별 통계

**향후 API**: `GET /api/admin/statistics/instructors`

#### Query Parameters
- `instructorId` (optional): 강사 필터
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "total": 10,
    "instructors": [
      {
        "instructorId": "instructor-001",
        "instructorName": "이선생",
        "courses": 3,
        "totalStudents": 45,
        "averageAttendanceRate": 94.5,
        "learningLogsCount": 36,
        "revenue": 4500000
      }
    ],
    "summary": {
      "averageCoursesPerInstructor": 2.5,
      "averageStudentsPerInstructor": 32.0,
      "averageAttendanceRate": 92.5
    }
  }
}
```

### 13.7 매출 분석

**향후 API**: `GET /api/admin/statistics/revenue`

#### Query Parameters
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜
- `groupBy` (optional): 그룹화 기준 (month, year, course)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000000,
    "projectedRevenue": 16000000,
    "actualVsProjected": 93.75,
    "byMonth": [
      {
        "month": "2024-01",
        "revenue": 15000000,
        "projected": 16000000,
        "difference": -1000000,
        "growth": 5.6
      }
    ],
    "byCourse": [
      {
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "revenue": 3600000,
        "contribution": 24.0,
        "enrollment": 18
      }
    ],
    "byPaymentMethod": {
      "cash": {
        "amount": 6000000,
        "percentage": 40.0
      },
      "card": {
        "amount": 5000000,
        "percentage": 33.3
      },
      "transfer": {
        "amount": 4000000,
        "percentage": 26.7
      }
    },
    "trend": {
      "growth": 5.6,
      "averageMonthlyGrowth": 4.2
    }
  }
}
```

### 13.8 경영 지표 (KPI)

**향후 API**: `GET /api/admin/statistics/kpi`

#### Query Parameters
- `period` (optional): 기간 (month, year)
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "revenuePerStudent": 100000,
    "averageCoursesPerStudent": 2.1,
    "averageStudentsPerCourse": 13.6,
    "averageCoursesPerInstructor": 2.5,
    "monthlyOperatingEfficiency": 85.5,
    "studentRetentionRate": 96.7,
    "courseUtilizationRate": 68.0,
    "instructorUtilizationRate": 80.0,
    "collectionRate": 96.0,
    "attendanceRate": 92.5
  }
}
```

### 13.9 통계 데이터 내보내기

**향후 API**: `GET /api/admin/statistics/export`

#### Query Parameters
- `type` (required): 통계 유형 (students, courses, payments, attendance, instructors, revenue, kpi)
- `format` (optional): 내보내기 형식 (excel, pdf, csv) - 기본값: excel
- `startDate` (optional): 시작 날짜
- `endDate` (optional): 종료 날짜

## 14. 문자 발송 API 🔄

### 14.1 결제 안내 문자 발송

**향후 API**: `POST /api/sms/payment-notice`

#### Request Body
```json
{
  "studentId": "student-001",
  "courseId": "course-001",
  "message": "수강료 입금 안내 메시지"
}
```

### 14.2 출석 알림 문자 발송

**향후 API**: `POST /api/sms/attendance-alert`

#### Request Body
```json
{
  "studentId": "student-001",
  "attendanceId": "attendance-001",
  "message": "오늘 수업에 결석하셨습니다."
}
```

### 14.3 공지사항 문자 발송

**향후 API**: `POST /api/sms/notice`

#### Request Body
```json
{
  "noticeId": "notice-001",
  "targetRoles": ["PARENT"]
}
```

## 15. 에러 코드

| 코드 | 설명 |
|------|------|
| `VALIDATION_ERROR` | 입력 데이터 검증 실패 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `DUPLICATE_ERROR` | 중복된 데이터 |
| `UNAUTHORIZED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `INTERNAL_ERROR` | 서버 내부 오류 |
| `SMS_SEND_FAILED` | 문자 발송 실패 |

## 16. API 버전 관리

현재 API 버전: `v1`

향후 버전 변경 시 URL에 버전을 포함할 수 있습니다:
- `/api/v1/students`
- `/api/v2/students`

## 17. 상태 표시

- ✅: 현재 구현 완료
- 🔄: 향후 구현 예정

