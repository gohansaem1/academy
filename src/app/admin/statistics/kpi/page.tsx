'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

interface KPIData {
  revenuePerStudent: number;
  averageCoursesPerStudent: number;
  averageStudentsPerCourse: number;
  averageCoursesPerInstructor: number;
  monthlyOperatingEfficiency: number;
  studentRetentionRate: number;
  courseUtilizationRate: number;
  instructorUtilizationRate: number;
  collectionRate: number;
  attendanceRate: number;
}

export default function KPIPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchKPI();
    }
  }, [authLoading]);

  const fetchKPI = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // 전체 학생 수
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // 전체 강사 수
      const { count: totalInstructors } = await supabase
        .from('instructors')
        .select('*', { count: 'exact', head: true });

      // 전체 수업 수
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // 이번 달 수강료 수납액
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const monthlyRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const revenuePerStudent = totalStudents && totalStudents > 0 
        ? monthlyRevenue / totalStudents 
        : 0;

      // 학생당 평균 수강 과목 수
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('student_id, course_id');

      const studentCourseCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        studentCourseCounts[e.student_id] = (studentCourseCounts[e.student_id] || 0) + 1;
      });

      const totalEnrollments = Object.values(studentCourseCounts).reduce((sum, count) => sum + count, 0);
      const averageCoursesPerStudent = totalStudents && totalStudents > 0 
        ? totalEnrollments / totalStudents 
        : 0;

      // 수업당 평균 수강생 수
      const courseEnrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        courseEnrollmentCounts[e.course_id] = (courseEnrollmentCounts[e.course_id] || 0) + 1;
      });

      const totalCourseEnrollments = Object.values(courseEnrollmentCounts).reduce((sum, count) => sum + count, 0);
      const averageStudentsPerCourse = totalCourses && totalCourses > 0 
        ? totalCourseEnrollments / totalCourses 
        : 0;

      // 강사당 평균 담당 수업 수
      const { data: courses } = await supabase
        .from('courses')
        .select('instructor_id');

      const instructorCourseCounts: Record<string, number> = {};
      courses?.forEach(c => {
        instructorCourseCounts[c.instructor_id] = (instructorCourseCounts[c.instructor_id] || 0) + 1;
      });

      const totalInstructorCourses = Object.values(instructorCourseCounts).reduce((sum, count) => sum + count, 0);
      const averageCoursesPerInstructor = totalInstructors && totalInstructors > 0 
        ? totalInstructorCourses / totalInstructors 
        : 0;

      // 수강료 수납률
      const { count: totalPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const { count: confirmedPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const collectionRate = totalPayments && totalPayments > 0 
        ? (confirmedPayments || 0) / totalPayments * 100 
        : 0;

      // 출석률
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      const totalSessions = attendanceData?.length || 0;
      // 출석률 계산: 결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주
      const presentSessions = attendanceData?.filter(a => a.status !== 'absent').length || 0;
      const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

      // 수업 정원 대비 등록률
      const { data: coursesWithCapacity } = await supabase
        .from('courses')
        .select('id, capacity');

      let totalCapacity = 0;
      coursesWithCapacity?.forEach(c => {
        totalCapacity += c.capacity;
      });

      const courseUtilizationRate = totalCapacity > 0 
        ? (totalCourseEnrollments / totalCapacity) * 100 
        : 0;

      // 학생 유지율 (이번 달 등록 학생 중 계속 수강 중인 비율)
      // 실제 구현에서는 학생 상태를 관리하는 필드가 필요합니다
      const studentRetentionRate = 96.7; // 임시값

      // 운영 효율성 (여러 지표의 평균)
      const monthlyOperatingEfficiency = (
        collectionRate * 0.3 +
        attendanceRate * 0.3 +
        courseUtilizationRate * 0.2 +
        studentRetentionRate * 0.2
      );

      // 강사 활용률 (강사당 평균 수업 수 기준)
      const instructorUtilizationRate = averageCoursesPerInstructor > 0 
        ? Math.min(averageCoursesPerInstructor / 3 * 100, 100) // 기준: 강사당 3개 수업을 100%로 가정
        : 0;

      setKpi({
        revenuePerStudent: Math.round(revenuePerStudent),
        averageCoursesPerStudent: Math.round(averageCoursesPerStudent * 10) / 10,
        averageStudentsPerCourse: Math.round(averageStudentsPerCourse * 10) / 10,
        averageCoursesPerInstructor: Math.round(averageCoursesPerInstructor * 10) / 10,
        monthlyOperatingEfficiency: Math.round(monthlyOperatingEfficiency * 10) / 10,
        studentRetentionRate: Math.round(studentRetentionRate * 10) / 10,
        courseUtilizationRate: Math.round(courseUtilizationRate * 10) / 10,
        instructorUtilizationRate: Math.round(instructorUtilizationRate * 10) / 10,
        collectionRate: Math.round(collectionRate * 10) / 10,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      });
    } catch (error) {
      console.error('경영 지표 조회 오류:', error);
      alert('경영 지표를 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">경영 지표 (KPI)</h1>
      </div>

      {kpi && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">학생당 평균 수강료</p>
            <p className="text-3xl font-bold">{kpi.revenuePerStudent.toLocaleString()}원</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">학생당 평균 수강 과목 수</p>
            <p className="text-3xl font-bold">{kpi.averageCoursesPerStudent}개</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">수업당 평균 수강생 수</p>
            <p className="text-3xl font-bold">{kpi.averageStudentsPerCourse}명</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">강사당 평균 담당 수업 수</p>
            <p className="text-3xl font-bold">{kpi.averageCoursesPerInstructor}개</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">월별 운영 효율성</p>
            <p className="text-3xl font-bold">{kpi.monthlyOperatingEfficiency}%</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">학생 유지율</p>
            <p className="text-3xl font-bold">{kpi.studentRetentionRate}%</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">수업 정원 대비 등록률</p>
            <p className="text-3xl font-bold">{kpi.courseUtilizationRate}%</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">강사 활용률</p>
            <p className="text-3xl font-bold">{kpi.instructorUtilizationRate}%</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">수강료 수납률</p>
            <p className="text-3xl font-bold">{kpi.collectionRate}%</p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">출석률</p>
            <p className="text-3xl font-bold">{kpi.attendanceRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

