'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';

interface StudentStatistics {
  total: number;
  newStudents: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  dropoutStudents: {
    thisMonth: number;
    lastMonth: number;
    dropoutRate: number;
  };
  trend: Array<{
    period: string;
    new: number;
    dropout: number;
    net: number;
  }>;
  distribution: {
    bySubject: Record<string, number>;
    byAge: Record<string, number>;
  };
  averageCoursesPerStudent: number;
}

export default function StudentStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!authLoading) {
      fetchStatistics();
    }
  }, [authLoading, startDate, endDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const firstDayOfMonth = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      // 전체 학생 수
      const { count: total } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // 이번 달 신규 학생
      const { count: newThisMonth } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);

      // 지난 달 신규 학생
      const { count: newLastMonth } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfLastMonth)
        .lte('created_at', lastDayOfLastMonth);

      const growth = newLastMonth && newLastMonth > 0 
        ? ((newThisMonth || 0) - newLastMonth) / newLastMonth * 100 
        : 0;

      // 이탈 학생 수 (삭제된 학생, 실제로는 삭제하지 않으므로 이번 달 등록 후 이탈한 경우를 계산)
      // 실제 구현에서는 학생 상태를 관리하는 필드가 필요할 수 있습니다
      const dropoutThisMonth = 0; // 임시값
      const dropoutLastMonth = 0; // 임시값
      const dropoutRate = total && total > 0 ? (dropoutThisMonth / total) * 100 : 0;

      // 학생별 수강 과목 수 계산
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('student_id');

      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        enrollmentCounts[e.student_id] = (enrollmentCounts[e.student_id] || 0) + 1;
      });

      const totalCourses = Object.values(enrollmentCounts).reduce((sum, count) => sum + count, 0);
      const averageCoursesPerStudent = total && total > 0 ? totalCourses / total : 0;

      // 과목별 분포 (수업별 학생 수)
      const { data: courses } = await supabase
        .from('courses')
        .select('id, subject');

      const { data: allEnrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, student_id');

      const bySubject: Record<string, number> = {};
      const studentSubjects: Record<string, Set<string>> = {};

      courses?.forEach(course => {
        const courseEnrollments = allEnrollments?.filter(e => e.course_id === course.id) || [];
        const uniqueStudents = new Set(courseEnrollments.map(e => e.student_id));
        
        bySubject[course.subject] = (bySubject[course.subject] || 0) + uniqueStudents.size;

        uniqueStudents.forEach(studentId => {
          if (!studentSubjects[studentId]) {
            studentSubjects[studentId] = new Set();
          }
          studentSubjects[studentId].add(course.subject);
        });
      });

      // 연령대별 분포 (현재는 데이터가 없으므로 임시로 전체로 표시)
      const byAge: Record<string, number> = {
        '전체': total || 0,
      };

      // 추이 데이터 (최근 6개월)
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
        const monthLast = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { count: monthNew } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthFirst)
          .lte('created_at', monthLast);

        trend.push({
          period: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          new: monthNew || 0,
          dropout: 0, // 실제 구현 필요
          net: monthNew || 0,
        });
      }

      setStats({
        total: total || 0,
        newStudents: {
          thisMonth: newThisMonth || 0,
          lastMonth: newLastMonth || 0,
          growth: Math.round(growth * 10) / 10,
        },
        dropoutStudents: {
          thisMonth: dropoutThisMonth,
          lastMonth: dropoutLastMonth,
          dropoutRate: Math.round(dropoutRate * 10) / 10,
        },
        trend,
        distribution: {
          bySubject,
          byAge,
        },
        averageCoursesPerStudent: Math.round(averageCoursesPerStudent * 10) / 10,
      });
    } catch (error) {
      console.error('수강생 통계 조회 오류:', error);
      alert('수강생 통계를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">수강생 현황 통계</h1>
      </div>

      {/* 기간 선택 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="시작일"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="종료일"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {stats && (
        <>
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">전체 학생 수</p>
              <p className="text-3xl font-bold">{stats.total}명</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">이번 달 신규 학생</p>
              <p className="text-3xl font-bold">{stats.newStudents.thisMonth}명</p>
              <p className={`text-sm mt-2 ${stats.newStudents.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.newStudents.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.newStudents.growth)}%
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">학생당 평균 수강 과목</p>
              <p className="text-3xl font-bold">{stats.averageCoursesPerStudent}개</p>
            </div>
          </div>

          {/* 과목별 분포 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">과목별 학생 분포</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.distribution.bySubject).map(([subject, count]) => (
                <div key={subject} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{subject}</p>
                  <p className="text-2xl font-bold mt-2">{count}명</p>
                </div>
              ))}
            </div>
          </div>

          {/* 추이 테이블 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">월별 추이</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">기간</th>
                    <th className="text-right p-2">신규</th>
                    <th className="text-right p-2">이탈</th>
                    <th className="text-right p-2">순증가</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.trend.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.period}</td>
                      <td className="text-right p-2">{item.new}명</td>
                      <td className="text-right p-2">{item.dropout}명</td>
                      <td className="text-right p-2 font-semibold">{item.net}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

