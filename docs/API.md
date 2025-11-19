# API 명세서

## 1. API 개요

학원 관리 시스템의 RESTful API 명세서입니다. 모든 API는 `/api` 경로를 기본으로 합니다.

## 2. 공통 사항

### 2.1 기본 URL

```
개발 환경: http://localhost:3000/api
프로덕션: https://your-domain.com/api
```

### 2.2 응답 형식

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

### 2.3 HTTP 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

## 3. 학생 관리 API

### 3.1 학생 목록 조회

**GET** `/api/students`

#### Query Parameters
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10)
- `search` (optional): 검색어 (이름, 전화번호)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "student-001",
        "name": "홍길동",
        "phone": "010-1234-5678",
        "email": "hong@example.com",
        "address": "서울시 강남구",
        "guardianName": "홍부모",
        "guardianPhone": "010-9876-5432",
        "enrolledCourses": ["course-001", "course-002"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### 3.2 학생 상세 조회

**GET** `/api/students/[id]`

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "student-001",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "email": "hong@example.com",
    "address": "서울시 강남구",
    "guardianName": "홍부모",
    "guardianPhone": "010-9876-5432",
    "enrolledCourses": [
      {
        "id": "course-001",
        "name": "수학 기초반",
        "subject": "수학"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 학생 등록

**POST** `/api/students`

#### Request Body
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "address": "서울시 강남구",
  "guardianName": "홍부모",
  "guardianPhone": "010-9876-5432"
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "student-001",
    "name": "홍길동",
    ...
  },
  "message": "학생이 성공적으로 등록되었습니다."
}
```

### 3.4 학생 정보 수정

**PUT** `/api/students/[id]`

#### Request Body
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "address": "서울시 강남구",
  "guardianName": "홍부모",
  "guardianPhone": "010-9876-5432"
}
```

### 3.5 학생 삭제

**DELETE** `/api/students/[id]`

#### 응답 예시
```json
{
  "success": true,
  "message": "학생이 성공적으로 삭제되었습니다."
}
```

## 4. 강사 관리 API

### 4.1 강사 목록 조회

**GET** `/api/instructors`

#### Query Parameters
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 항목 수
- `subject` (optional): 과목 필터

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "instructors": [
      {
        "id": "instructor-001",
        "name": "김선생",
        "phone": "010-1111-2222",
        "email": "kim@example.com",
        "subject": "수학",
        "courses": ["course-001"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

### 4.2 강사 상세 조회

**GET** `/api/instructors/[id]`

### 4.3 강사 등록

**POST** `/api/instructors`

#### Request Body
```json
{
  "name": "김선생",
  "phone": "010-1111-2222",
  "email": "kim@example.com",
  "subject": "수학"
}
```

### 4.4 강사 정보 수정

**PUT** `/api/instructors/[id]`

### 4.5 강사 삭제

**DELETE** `/api/instructors/[id]`

## 5. 수업 관리 API

### 5.1 수업 목록 조회

**GET** `/api/courses`

#### Query Parameters
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 항목 수
- `subject` (optional): 과목 필터
- `instructorId` (optional): 강사 필터

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-001",
        "name": "수학 기초반",
        "subject": "수학",
        "instructorId": "instructor-001",
        "instructorName": "김선생",
        "schedule": {
          "dayOfWeek": 1,
          "startTime": "14:00",
          "endTime": "15:30"
        },
        "capacity": 20,
        "enrolledCount": 15,
        "tuitionFee": 100000,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 30,
      "totalPages": 3
    }
  }
}
```

### 5.2 수업 상세 조회

**GET** `/api/courses/[id]`

### 5.3 수업 등록

**POST** `/api/courses`

#### Request Body
```json
{
  "name": "수학 기초반",
  "subject": "수학",
  "instructorId": "instructor-001",
  "schedule": {
    "dayOfWeek": 1,
    "startTime": "14:00",
    "endTime": "15:30"
  },
  "capacity": 20,
  "tuitionFee": 100000
}
```

### 5.4 수업 정보 수정

**PUT** `/api/courses/[id]`

### 5.5 수업 삭제

**DELETE** `/api/courses/[id]`

### 5.6 학생 수업 등록

**POST** `/api/courses/[id]/enroll`

#### Request Body
```json
{
  "studentId": "student-001"
}
```

### 5.7 학생 수업 취소

**DELETE** `/api/courses/[id]/enroll`

#### Query Parameters
- `studentId`: 학생 ID

## 6. 출석 관리 API

### 6.1 출석 기록 조회

**GET** `/api/attendance`

#### Query Parameters
- `courseId` (optional): 수업 ID
- `studentId` (optional): 학생 ID
- `startDate` (optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (optional): 종료 날짜 (YYYY-MM-DD)

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "attendance-001",
        "courseId": "course-001",
        "courseName": "수학 기초반",
        "studentId": "student-001",
        "studentName": "홍길동",
        "date": "2024-01-15",
        "status": "present",
        "createdAt": "2024-01-15T14:00:00Z"
      }
    ]
  }
}
```

### 6.2 출석 체크

**POST** `/api/attendance`

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

### 6.3 출석 통계 조회

**GET** `/api/attendance/statistics`

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
    "attendanceRate": 83.3
  }
}
```

## 7. 수강료 관리 API

### 7.1 결제 이력 조회

**GET** `/api/payments`

#### Query Parameters
- `studentId` (optional): 학생 ID
- `courseId` (optional): 수업 ID
- `status` (optional): 결제 상태 (completed, pending, cancelled)
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
        "paymentMethod": "card",
        "paymentDate": "2024-01-01",
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 7.2 결제 처리

**POST** `/api/payments`

#### Request Body
```json
{
  "studentId": "student-001",
  "courseId": "course-001",
  "amount": 100000,
  "paymentMethod": "card",
  "paymentDate": "2024-01-01"
}
```

#### Payment Method 값
- `cash`: 현금
- `card`: 카드
- `transfer`: 계좌이체

### 7.3 결제 취소

**PUT** `/api/payments/[id]/cancel`

#### 응답 예시
```json
{
  "success": true,
  "message": "결제가 성공적으로 취소되었습니다."
}
```

### 7.4 미납 조회

**GET** `/api/payments/overdue`

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

## 8. 에러 코드

| 코드 | 설명 |
|------|------|
| `VALIDATION_ERROR` | 입력 데이터 검증 실패 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `DUPLICATE_ERROR` | 중복된 데이터 |
| `UNAUTHORIZED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `INTERNAL_ERROR` | 서버 내부 오류 |

## 9. 인증 (향후 구현)

### 9.1 로그인

**POST** `/api/auth/login`

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
      "role": "admin"
    }
  }
}
```

### 9.2 인증 헤더

인증이 필요한 API 요청 시 다음 헤더를 포함해야 합니다:

```
Authorization: Bearer {token}
```

## 10. API 버전 관리

현재 API 버전: `v1`

향후 버전 변경 시 URL에 버전을 포함할 수 있습니다:
- `/api/v1/students`
- `/api/v2/students`

