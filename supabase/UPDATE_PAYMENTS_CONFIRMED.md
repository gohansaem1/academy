# 수강료 입금 확인 상태 추가 SQL

수강료 관리에 입금 확인(confirmed) 상태를 추가하기 위해 Supabase에 다음 SQL을 실행해야 합니다.

## 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 아래 SQL 스크립트를 복사하여 붙여넣기
6. **Run** 버튼 클릭

## SQL 스크립트

```sql
-- 수강료 입금 테이블의 status 컬럼에 'confirmed' 상태 추가
-- 기존 CHECK 제약조건을 수정하여 'confirmed' 상태를 포함하도록 변경

-- 기존 제약조건 삭제
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- 새로운 제약조건 추가 (confirmed 포함)
ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('completed', 'pending', 'confirmed', 'cancelled'));

-- 기본값을 'pending'으로 변경 (선택사항)
ALTER TABLE payments 
ALTER COLUMN status SET DEFAULT 'pending';
```

## 확인

SQL 실행 후 다음 쿼리로 제약조건이 올바르게 설정되었는지 확인하세요:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'payments_status_check';
```

## 상태 설명

- `pending`: 입금 대기 중 (기본값)
- `completed`: 입금 완료 (자동 등록 시)
- `confirmed`: 입금 확인됨 (관리자 확인 후)
- `cancelled`: 취소됨

## 참고

- 새로운 입금 기록은 기본적으로 'pending' 상태로 등록됩니다
- 관리자가 입금을 확인하면 'confirmed' 상태로 변경됩니다
- 총 수납액 통계는 'completed'와 'confirmed' 상태를 모두 포함합니다

