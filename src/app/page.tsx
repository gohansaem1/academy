import Link from 'next/link';
import Button from '@/components/common/Button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">학원 관리 시스템</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl">
        학생, 강사, 수업, 출석, 수강료를 효율적으로 관리할 수 있는 통합 관리 시스템입니다.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        <Link href="/students">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">학생 관리</h2>
            <p className="text-gray-600 text-sm">학생 등록, 정보 수정, 수강 이력 관리</p>
          </div>
        </Link>
        
        <Link href="/instructors">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">강사 관리</h2>
            <p className="text-gray-600 text-sm">강사 등록, 정보 관리, 담당 수업 관리</p>
          </div>
        </Link>
        
        <Link href="/courses">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">수업 관리</h2>
            <p className="text-gray-600 text-sm">수업 등록, 스케줄 관리, 학생 등록</p>
          </div>
        </Link>
        
        <Link href="/attendance">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">출석 관리</h2>
            <p className="text-gray-600 text-sm">출석 체크, 기록 조회, 통계</p>
          </div>
        </Link>
        
        <Link href="/payments">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">수강료 관리</h2>
            <p className="text-gray-600 text-sm">결제 처리, 이력 조회, 미납 관리</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
