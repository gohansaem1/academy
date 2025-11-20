'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Button from '@/components/common/Button';

interface DashboardOverview {
  totalStudents: number;
  inactiveStudents?: number;
  totalInstructors: number;
  totalCourses: number;
  activeEnrollments: number;
  monthlyRevenue: number;
  monthlyRevenueGrowth: number;
  attendanceRate: number;
  attendanceRateGrowth: number;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
}

interface QuickStats {
  newStudentsThisMonth: number;
  newCoursesThisMonth: number;
  pendingPayments: number;
  lowAttendanceStudents: number;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 전체 학생 수 (재학생만)
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.eq.active');
      
      // 그만둔 학생 수
      const { count: inactiveStudentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');

      // 전체 강사 수
      const { count: instructorCount } = await supabase
        .from('instructors')
        .select('*', { count: 'exact', head: true });

      // 전체 수업 수
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // 활성 등록 수
      const { count: enrollmentCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true });

      // 이번 달 수강료 수납액
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: thisMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const monthlyRevenue = thisMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 지난 달 수강료 수납액
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfLastMonth)
        .lte('payment_date', lastDayOfLastMonth);

      const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const monthlyRevenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // 출석률 계산 (결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주)
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      const totalSessions = attendanceData?.length || 0;
      const presentSessions = attendanceData?.filter(a => a.status !== 'absent').length || 0;
      const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

      // 지난 달 출석률 (결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주)
      const { data: lastMonthAttendance } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', firstDayOfLastMonth)
        .lte('date', lastDayOfLastMonth);

      const lastMonthTotal = lastMonthAttendance?.length || 0;
      const lastMonthPresent = lastMonthAttendance?.filter(a => a.status !== 'absent').length || 0;
      const lastMonthAttendanceRate = lastMonthTotal > 0 ? (lastMonthPresent / lastMonthTotal) * 100 : 0;
      const attendanceRateGrowth = lastMonthAttendanceRate > 0 
        ? attendanceRate - lastMonthAttendanceRate 
        : 0;

      setOverview({
        totalStudents: studentCount || 0,
        inactiveStudents: inactiveStudentCount || 0,
        totalInstructors: instructorCount || 0,
        totalCourses: courseCount || 0,
        activeEnrollments: enrollmentCount || 0,
        monthlyRevenue,
        monthlyRevenueGrowth: Math.round(monthlyRevenueGrowth * 10) / 10,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        attendanceRateGrowth: Math.round(attendanceRateGrowth * 10) / 10,
      });

      // 이번 달 신규 학생 수
      const { count: newStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      // 이번 달 신규 수업 수
      const { count: newCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      // 대기 중인 결제 수
      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 출석률이 낮은 학생 수 (70% 미만, 재학생만)
      const { data: allStudents } = await supabase
        .from('students')
        .select('id')
        .or('status.is.null,status.eq.active');

      let lowAttendanceCount = 0;
      if (allStudents) {
        for (const student of allStudents) {
          const { data: studentAttendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', student.id)
            .gte('date', firstDayOfMonth)
            .lte('date', lastDayOfMonth);

          const studentTotal = studentAttendance?.length || 0;
          const studentPresent = studentAttendance?.filter(a => a.status !== 'absent').length || 0;
          const studentRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 100;

          if (studentRate < 70 && studentTotal > 0) {
            lowAttendanceCount++;
          }
        }
      }

      setQuickStats({
        newStudentsThisMonth: newStudents || 0,
        newCoursesThisMonth: newCourses || 0,
        pendingPayments: pendingPayments || 0,
        lowAttendanceStudents: lowAttendanceCount,
      });

      // 최근 활동 (최근 등록된 학생, 수업 등, 재학생만)
      const { data: recentStudents } = await supabase
        .from('students')
        .select('name, created_at')
        .or('status.is.null,status.eq.active')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (recentStudents || []).map(student => ({
        type: 'student_registered',
        message: `${student.name} 학생이 등록되었습니다.`,
        timestamp: student.created_at,
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
      alert('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <Link href="/admin/statistics/kpi">
          <Button variant="outline">경영 지표 보기</Button>
        </Link>
      </div>

      {/* 핵심 지표 카드 */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">재학생 수</p>
                <p className="text-3xl font-bold">{overview.totalStudents}명</p>
                {overview.inactiveStudents !== undefined && overview.inactiveStudents > 0 && (
                  <p className="text-xs text-gray-400 mt-1">그만둔: {overview.inactiveStudents}명</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">전체 강사 수</p>
                <p className="text-3xl font-bold">{overview.totalInstructors}명</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍🏫</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">전체 수업 수</p>
                <p className="text-3xl font-bold">{overview.totalCourses}개</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">활성 등록 수</p>
                <p className="text-3xl font-bold">{overview.activeEnrollments}건</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수익 및 출석률 카드 */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">이번 달 수강료 수납</h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{overview.monthlyRevenue.toLocaleString()}원</p>
                <p className={`text-sm mt-2 ${overview.monthlyRevenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overview.monthlyRevenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(overview.monthlyRevenueGrowth)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">이번 달 출석률</h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{overview.attendanceRate}%</p>
                <p className={`text-sm mt-2 ${overview.attendanceRateGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overview.attendanceRateGrowth >= 0 ? '↑' : '↓'} {Math.abs(overview.attendanceRateGrowth)}%p
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 빠른 통계 및 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 빠른 통계 */}
        {quickStats && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">빠른 통계</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">이번 달 신규 학생</span>
                <span className="font-semibold">{quickStats.newStudentsThisMonth}명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">이번 달 신규 수업</span>
                <span className="font-semibold">{quickStats.newCoursesThisMonth}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">대기 중인 결제</span>
                <Link href="/payments?status=pending" className="font-semibold text-blue-600 hover:underline">
                  {quickStats.pendingPayments}건
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">출석률 낮은 학생</span>
                <span className="font-semibold text-red-600">{quickStats.lowAttendanceStudents}명</span>
              </div>
            </div>
          </div>
        )}

        {/* 최근 활동 */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">최근 활동이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 통계 페이지 링크 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">상세 통계 보기</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/statistics/students">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">수강생 현황</p>
              <p className="text-sm text-gray-500 mt-1">학생 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/courses">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">수업 현황</p>
              <p className="text-sm text-gray-500 mt-1">수업 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/payments">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">수강료 수납</p>
              <p className="text-sm text-gray-500 mt-1">결제 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/attendance">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">출석률</p>
              <p className="text-sm text-gray-500 mt-1">출석 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/instructors">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">강사별</p>
              <p className="text-sm text-gray-500 mt-1">강사 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/revenue">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">매출 분석</p>
              <p className="text-sm text-gray-500 mt-1">매출 통계</p>
            </div>
          </Link>
          <Link href="/admin/statistics/kpi">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <p className="font-medium">경영 지표</p>
              <p className="text-sm text-gray-500 mt-1">KPI</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

