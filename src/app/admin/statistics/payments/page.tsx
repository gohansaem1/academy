'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';
import Link from 'next/link';

interface PaymentStatistics {
  totalRevenue: number;
  thisMonth: {
    revenue: number;
    lastMonth: number;
    growth: number;
  };
  byMonth: Array<{
    month: string;
    revenue: number;
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
  }>;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    revenue: number;
    paidCount: number;
    pendingCount: number;
  }>;
  byPaymentMethod: Record<string, number>;
  pendingPayments: {
    count: number;
    totalAmount: number;
    students: Array<{
      studentId: string;
      studentName: string;
      amount: number;
      dueDate: string;
    }>;
  };
  collectionRate: number;
}

export default function PaymentStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<PaymentStatistics | null>(null);
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

      // 전체 수납액
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'confirmed');

      const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 이번 달 수납액
      const { data: thisMonthPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 지난 달 수납액
      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfLastMonth)
        .lte('payment_date', lastDayOfLastMonth);

      const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const growth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // 월별 통계 (최근 6개월)
      const byMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
        const monthLast = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: monthPayments } = await supabase
          .from('payments')
          .select('amount, status')
          .gte('payment_date', monthFirst)
          .lte('payment_date', monthLast);

        const revenue = monthPayments?.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0) || 0;
        const paidCount = monthPayments?.filter(p => p.status === 'confirmed').length || 0;
        const pendingCount = monthPayments?.filter(p => p.status === 'pending').length || 0;
        const cancelledCount = monthPayments?.filter(p => p.status === 'cancelled').length || 0;

        byMonth.push({
          month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          revenue,
          paidCount,
          pendingCount,
          cancelledCount,
        });
      }

      // 수업별 통계
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name');

      const { data: allPaymentsWithCourse } = await supabase
        .from('payments')
        .select('course_id, amount, status')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const byCourse: Array<{ courseId: string; courseName: string; revenue: number; paidCount: number; pendingCount: number }> = [];
      courses?.forEach(course => {
        const coursePayments = allPaymentsWithCourse?.filter(p => p.course_id === course.id) || [];
        const revenue = coursePayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
        const paidCount = coursePayments.filter(p => p.status === 'confirmed').length;
        const pendingCount = coursePayments.filter(p => p.status === 'pending').length;

        if (revenue > 0 || paidCount > 0 || pendingCount > 0) {
          byCourse.push({
            courseId: course.id,
            courseName: course.name,
            revenue,
            paidCount,
            pendingCount,
          });
        }
      });

      byCourse.sort((a, b) => b.revenue - a.revenue);

      // 결제 방법별 통계
      const { data: paymentsByMethod } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const byPaymentMethod: Record<string, number> = {};
      paymentsByMethod?.forEach(p => {
        byPaymentMethod[p.payment_method] = (byPaymentMethod[p.payment_method] || 0) + p.amount;
      });

      // 대기 중인 결제
      const { data: pendingPaymentsData } = await supabase
        .from('payments')
        .select(`
          id,
          student_id,
          amount,
          payment_date,
          students(name)
        `)
        .eq('status', 'pending')
        .order('payment_date', { ascending: true });

      const pendingTotalAmount = pendingPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pendingStudents = (pendingPaymentsData || []).map(p => ({
        studentId: p.student_id,
        studentName: (p.students as any)?.name || '-',
        amount: p.amount,
        dueDate: p.payment_date,
      }));

      // 수납률
      const { count: totalPaymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const { count: confirmedPaymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const collectionRate = totalPaymentsCount && totalPaymentsCount > 0
        ? ((confirmedPaymentsCount || 0) / totalPaymentsCount) * 100
        : 0;

      setStats({
        totalRevenue,
        thisMonth: {
          revenue: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growth: Math.round(growth * 10) / 10,
        },
        byMonth,
        byCourse,
        byPaymentMethod,
        pendingPayments: {
          count: pendingPaymentsData?.length || 0,
          totalAmount: pendingTotalAmount,
          students: pendingStudents,
        },
        collectionRate: Math.round(collectionRate * 10) / 10,
      });
    } catch (error) {
      console.error('수강료 통계 조회 오류:', error);
      alert('수강료 통계를 불러오는 중 오류가 발생했습니다.');
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

  const PAYMENT_METHODS: Record<string, string> = {
    cash: '현금',
    card: '카드',
    transfer: '계좌이체',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">수강료 수납 통계</h1>
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
              <p className="text-sm text-gray-500 mb-2">전체 수납액</p>
              <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}원</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">이번 달 수납액</p>
              <p className="text-3xl font-bold">{stats.thisMonth.revenue.toLocaleString()}원</p>
              <p className={`text-sm mt-2 ${stats.thisMonth.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.thisMonth.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.thisMonth.growth)}%
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">수납률</p>
              <p className="text-3xl font-bold">{stats.collectionRate}%</p>
            </div>
          </div>

          {/* 월별 추이 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">월별 수납 추이</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">월</th>
                    <th className="text-right p-2">수납액</th>
                    <th className="text-right p-2">완료</th>
                    <th className="text-right p-2">대기</th>
                    <th className="text-right p-2">취소</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byMonth.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.month}</td>
                      <td className="text-right p-2 font-semibold">{item.revenue.toLocaleString()}원</td>
                      <td className="text-right p-2">{item.paidCount}건</td>
                      <td className="text-right p-2 text-yellow-600">{item.pendingCount}건</td>
                      <td className="text-right p-2 text-red-600">{item.cancelledCount}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 수업별 통계 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">수업별 수납 통계</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">수업명</th>
                    <th className="text-right p-2">수납액</th>
                    <th className="text-right p-2">완료</th>
                    <th className="text-right p-2">대기</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCourse.map((course) => (
                    <tr key={course.courseId} className="border-b">
                      <td className="p-2">
                        <Link href={`/courses/${course.courseId}`} className="text-blue-600 hover:underline">
                          {course.courseName}
                        </Link>
                      </td>
                      <td className="text-right p-2 font-semibold">{course.revenue.toLocaleString()}원</td>
                      <td className="text-right p-2">{course.paidCount}건</td>
                      <td className="text-right p-2 text-yellow-600">{course.pendingCount}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 결제 방법별 통계 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">결제 방법별 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.byPaymentMethod).map(([method, amount]) => (
                <div key={method} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{PAYMENT_METHODS[method] || method}</p>
                  <p className="text-2xl font-bold mt-2">{amount.toLocaleString()}원</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.thisMonth.revenue > 0 ? Math.round((amount / stats.thisMonth.revenue) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 대기 중인 결제 */}
          {stats.pendingPayments.count > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">대기 중인 결제 ({stats.pendingPayments.count}건)</h2>
                <Link href="/payments?status=pending">
                  <span className="text-blue-600 hover:underline text-sm">전체 보기 →</span>
                </Link>
              </div>
              <div className="mb-2">
                <p className="text-sm text-gray-500">총 대기 금액</p>
                <p className="text-2xl font-bold">{stats.pendingPayments.totalAmount.toLocaleString()}원</p>
              </div>
              <div className="space-y-2 mt-4">
                {stats.pendingPayments.students.slice(0, 5).map((student, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-gray-500">마감일: {new Date(student.dueDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <p className="font-semibold">{student.amount.toLocaleString()}원</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

