'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface InstructorStatistics {
  total: number;
  instructors: Array<{
    instructorId: string;
    instructorName: string;
    courses: number;
    totalStudents: number;
    averageAttendanceRate: number;
    learningLogsCount: number;
    revenue: number;
  }>;
  summary: {
    averageCoursesPerInstructor: number;
    averageStudentsPerInstructor: number;
    averageAttendanceRate: number;
  };
}

export default function InstructorStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<InstructorStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchStatistics();
    }
  }, [authLoading]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // 전체 강사 수
      const { count: total, data: instructors } = await supabase
        .from('instructors')
        .select('*');

      // 강사별 통계
      const instructorStats: Array<{
        instructorId: string;
        instructorName: string;
        courses: number;
        totalStudents: number;
        averageAttendanceRate: number;
        learningLogsCount: number;
        revenue: number;
      }> = [];

      if (instructors) {
        for (const instructor of instructors) {
          // 강사별 담당 수업 수
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', instructor.id);

          // 강사별 수강생 수
          const { data: instructorCourses } = await supabase
            .from('courses')
            .select('id')
            .eq('instructor_id', instructor.id);

          const courseIds = instructorCourses?.map(c => c.id) || [];
          let totalStudents = 0;
          const studentSet = new Set<string>();

          if (courseIds.length > 0) {
            const { data: enrollments } = await supabase
              .from('course_enrollments')
              .select('student_id')
              .in('course_id', courseIds);

            enrollments?.forEach(e => {
              studentSet.add(e.student_id);
            });
            totalStudents = studentSet.size;
          }

          // 강사별 출석률 평균
          let totalAttendanceRate = 0;
          let courseCountWithAttendance = 0;

          if (courseIds.length > 0) {
            const { data: attendanceData } = await supabase
              .from('attendance')
              .select('course_id, status')
              .in('course_id', courseIds)
              .gte('date', firstDayOfMonth)
              .lte('date', lastDayOfMonth);

            const attendanceByCourse: Record<string, { total: number; present: number }> = {};
            attendanceData?.forEach(a => {
              if (!attendanceByCourse[a.course_id]) {
                attendanceByCourse[a.course_id] = { total: 0, present: 0 };
              }
              attendanceByCourse[a.course_id].total++;
              if (a.status === 'present' || a.status === 'late') {
                attendanceByCourse[a.course_id].present++;
              }
            });

            Object.values(attendanceByCourse).forEach(courseAttendance => {
              if (courseAttendance.total > 0) {
                const rate = (courseAttendance.present / courseAttendance.total) * 100;
                totalAttendanceRate += rate;
                courseCountWithAttendance++;
              }
            });
          }

          const averageAttendanceRate = courseCountWithAttendance > 0
            ? totalAttendanceRate / courseCountWithAttendance
            : 0;

          // 강사별 학습일지 작성 건수
          const { count: learningLogsCount } = await supabase
            .from('learning_logs')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', instructor.id)
            .gte('date', firstDayOfMonth)
            .lte('date', lastDayOfMonth);

          // 강사별 수강료 수납액
          let revenue = 0;
          if (courseIds.length > 0) {
            const { data: payments } = await supabase
              .from('payments')
              .select('amount')
              .eq('status', 'confirmed')
              .in('course_id', courseIds)
              .gte('payment_date', firstDayOfMonth)
              .lte('payment_date', lastDayOfMonth);

            revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          }

          instructorStats.push({
            instructorId: instructor.id,
            instructorName: instructor.name,
            courses: courseCount || 0,
            totalStudents,
            averageAttendanceRate: Math.round(averageAttendanceRate * 10) / 10,
            learningLogsCount: learningLogsCount || 0,
            revenue,
          });
        }
      }

      // 전체 요약 통계
      const totalCourses = instructorStats.reduce((sum, i) => sum + i.courses, 0);
      const totalStudents = instructorStats.reduce((sum, i) => sum + i.totalStudents, 0);
      const totalAttendanceRate = instructorStats.reduce((sum, i) => sum + i.averageAttendanceRate, 0);

      setStats({
        total: total || 0,
        instructors: instructorStats.sort((a, b) => b.revenue - a.revenue),
        summary: {
          averageCoursesPerInstructor: total && total > 0 ? Math.round((totalCourses / total) * 10) / 10 : 0,
          averageStudentsPerInstructor: total && total > 0 ? Math.round((totalStudents / total) * 10) / 10 : 0,
          averageAttendanceRate: instructorStats.length > 0 ? Math.round((totalAttendanceRate / instructorStats.length) * 10) / 10 : 0,
        },
      });
    } catch (error) {
      console.error('강사 통계 조회 오류:', error);
      alert('강사 통계를 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">강사별 통계</h1>
      </div>

      {stats && (
        <>
          {/* 요약 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">강사당 평균 담당 수업 수</p>
              <p className="text-3xl font-bold">{stats.summary.averageCoursesPerInstructor}개</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">강사당 평균 수강생 수</p>
              <p className="text-3xl font-bold">{stats.summary.averageStudentsPerInstructor}명</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">평균 출석률</p>
              <p className="text-3xl font-bold">{stats.summary.averageAttendanceRate}%</p>
            </div>
          </div>

          {/* 강사별 상세 통계 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">강사별 상세 통계</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">강사명</th>
                    <th className="text-right p-2">담당 수업</th>
                    <th className="text-right p-2">수강생 수</th>
                    <th className="text-right p-2">평균 출석률</th>
                    <th className="text-right p-2">학습일지</th>
                    <th className="text-right p-2">수납액</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.instructors.map((instructor) => (
                    <tr key={instructor.instructorId} className="border-b">
                      <td className="p-2">
                        <Link
                          href={`/instructors/${instructor.instructorId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {instructor.instructorName}
                        </Link>
                      </td>
                      <td className="text-right p-2">{instructor.courses}개</td>
                      <td className="text-right p-2">{instructor.totalStudents}명</td>
                      <td className="text-right p-2">{instructor.averageAttendanceRate}%</td>
                      <td className="text-right p-2">{instructor.learningLogsCount}건</td>
                      <td className="text-right p-2 font-semibold">{instructor.revenue.toLocaleString()}원</td>
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

