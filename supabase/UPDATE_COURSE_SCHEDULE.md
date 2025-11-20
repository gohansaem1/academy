# 수업 일정 스케줄 기능 업데이트 가이드

## 개요

수업 정보에 여러 요일 선택 및 요일별 시간 설정 기능을 추가했습니다.

## 데이터베이스 업데이트

Supabase SQL Editor에서 다음 SQL 스크립트를 실행하세요:

```sql
-- 수업 일정 스케줄 기능 추가
-- 여러 요일 선택 및 요일별 시간 설정 지원

-- courses 테이블에 schedule JSON 필드 추가
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT NULL;

-- 기존 데이터 마이그레이션 (day_of_week, start_time, end_time을 schedule로 변환)
UPDATE courses
SET schedule = jsonb_build_array(
  jsonb_build_object(
    'day_of_week', day_of_week,
    'start_time', start_time,
    'end_time', end_time
  )
)
WHERE schedule IS NULL;

-- 인덱스 추가 (JSON 필드 검색용)
CREATE INDEX IF NOT EXISTS idx_courses_schedule ON courses USING GIN (schedule);
```

## 주요 변경사항

1. **데이터베이스 스키마**
   - `courses` 테이블에 `schedule` JSONB 필드 추가
   - 기존 `day_of_week`, `start_time`, `end_time` 필드는 하위 호환성을 위해 유지

2. **UI 변경사항**
   - 수업 등록/수정 페이지에서 여러 요일 선택 가능
   - 기본 시간 설정 후 각 요일별로 시간 변경 가능
   - 수업 목록 및 상세 페이지에서 여러 요일 표시

3. **데이터 구조**
   ```json
   {
     "schedule": [
       {
         "day_of_week": 1,
         "start_time": "09:00",
         "end_time": "10:00"
       },
       {
         "day_of_week": 3,
         "start_time": "09:00",
         "end_time": "10:00"
       },
       {
         "day_of_week": 5,
         "start_time": "10:00",
         "end_time": "11:00"
       }
     ]
   }
   ```

## 사용 방법

1. **수업 등록/수정 시**
   - 기본 시작 시간과 종료 시간을 설정
   - 수업이 진행되는 요일을 선택 (여러 개 선택 가능)
   - 특정 요일의 시간이 기본 시간과 다를 경우, 해당 요일의 "시간 변경" 버튼을 클릭하여 개별 설정

2. **예시**
   - 월수금 수업: 월요일, 수요일, 금요일 선택
   - 화목토 수업: 화요일, 목요일, 토요일 선택
   - 특정 요일만 시간이 다른 경우: 기본 시간 설정 후 해당 요일만 시간 변경

## 주의사항

- 기존 데이터는 자동으로 마이그레이션됩니다
- 하위 호환성을 위해 기존 필드(`day_of_week`, `start_time`, `end_time`)도 유지됩니다
- 새로운 수업은 `schedule` 필드를 사용하며, 첫 번째 스케줄이 기본값으로 설정됩니다

