# 학습일지 테이블 추가 SQL

학습일지 기능을 사용하기 위해 Supabase에 다음 SQL을 실행해야 합니다.

## 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `krcncyrwiirgfvzsqpjy`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 아래 SQL 스크립트를 복사하여 붙여넣기
6. **Run** 버튼 클릭

## SQL 스크립트

```sql
-- 학습일지 테이블 생성
CREATE TABLE IF NOT EXISTS learning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  homework TEXT,
  notes TEXT,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_learning_logs_course_id ON learning_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_date ON learning_logs(date);
CREATE INDEX IF NOT EXISTS idx_learning_logs_instructor_id ON learning_logs(instructor_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_learning_logs_updated_at 
  BEFORE UPDATE ON learning_logs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE learning_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON learning_logs;
CREATE POLICY "Allow all operations for authenticated users" ON learning_logs
  FOR ALL USING (true) WITH CHECK (true);
```

## 확인

SQL 실행 후 다음 쿼리로 테이블이 생성되었는지 확인하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'learning_logs';
```

## 참고

- `learning_logs` 테이블은 `courses`와 `instructors` 테이블에 의존합니다
- 한 수업에 같은 날짜의 학습일지는 하나만 등록 가능합니다 (UNIQUE 제약조건)
- 수업이 삭제되면 해당 수업의 학습일지도 함께 삭제됩니다 (CASCADE)

