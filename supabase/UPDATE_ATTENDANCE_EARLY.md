# 출석 테이블 조퇴(early) 상태 추가 SQL

출석 관리에 조퇴 상태를 추가하기 위해 Supabase에 다음 SQL을 실행해야 합니다.

## 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 아래 SQL 스크립트를 복사하여 붙여넣기
6. **Run** 버튼 클릭

## SQL 스크립트

```sql
-- 출석 테이블에 조퇴(early) 상태 추가
-- 기존 CHECK 제약조건을 수정하여 'early' 상태를 포함하도록 변경

-- 기존 제약조건 삭제
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

-- 새로운 제약조건 추가 (early 포함)
ALTER TABLE attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'late', 'absent', 'early'));
```

## 확인

SQL 실행 후 다음 쿼리로 제약조건이 올바르게 설정되었는지 확인하세요:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'attendance_status_check';
```

## 참고

- 조퇴(early) 상태는 출석 체크 시 선택할 수 있습니다
- 출석 통계에서도 조퇴 상태가 별도로 집계됩니다

