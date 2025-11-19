/**
 * Supabase 데이터베이스 스키마 생성 스크립트
 * 
 * 사용법:
 * npx tsx scripts/setup-database.ts
 * 또는
 * npm run setup:db
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  try {
    console.log('🚀 데이터베이스 스키마 생성을 시작합니다...\n');

    // SQL 파일 읽기
    const sqlPath = join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // SQL 문을 세미콜론으로 분리 (간단한 분리)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 ${statements.length}개의 SQL 문을 실행합니다...\n`);

    // 각 SQL 문 실행
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 주석 제거
      const cleanStatement = statement
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (!cleanStatement) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: cleanStatement });
        
        if (error) {
          // RPC가 없을 경우 직접 쿼리 실행 시도
          const { error: queryError } = await supabase
            .from('_migration_check')
            .select('*')
            .limit(0);

          // 대안: Supabase REST API를 통한 직접 실행은 제한적이므로
          // 사용자에게 SQL Editor에서 실행하도록 안내
          console.warn(`⚠️  SQL 문 ${i + 1} 실행 중 오류가 발생했습니다.`);
          console.warn(`   Supabase SQL Editor에서 직접 실행하는 것을 권장합니다.`);
          console.warn(`   오류: ${error.message}\n`);
        } else {
          console.log(`✅ SQL 문 ${i + 1} 실행 완료`);
        }
      } catch (err) {
        console.warn(`⚠️  SQL 문 ${i + 1} 실행 중 예외 발생:`, err);
      }
    }

    console.log('\n✨ 데이터베이스 스키마 생성이 완료되었습니다!');
    console.log('\n📌 참고: Supabase SQL Editor에서 직접 실행하는 것을 권장합니다.');
    console.log('   파일 위치: supabase/migrations/001_initial_schema.sql');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

setupDatabase();

