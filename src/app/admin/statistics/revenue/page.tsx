'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';
import Link from 'next/link';

interface RevenueStatistics {
  totalRevenue: number;
  projectedRevenue: number;
  actualVsProjected: number;
  byMonth: Array<{
    month: string;
    revenue: number;
    projected: number;
    difference: number;
    growth: number;
  }>;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    revenue: number;
    contribution: number;
    enrollment: number;
  }>;
  byPaymentMethod: Record<string, {
    amount: number;
    percentage: number;
  }>;
  trend: {
    growth: number;
    averageMonthlyGrowth: number;
  };
}

export default function RevenueStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<RevenueStatistics | null>(null);
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

      // 전체 수납액
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed');

      const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 이번 달 수납액
      const { data: thisMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 예상 수납액 (수업별 수강료 * 등록 학생 수)
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, tuition_fee');

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, student_id');

      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });

      const projectedRevenue = courses?.reduce((sum, c) => {
        const enrollment = enrollmentCounts[c.id] || 0;
        return sum + (c.tuition_fee * enrollment);
      }, 0) || 0;

      const actualVsProjected = projectedRevenue > 0 ? (thisMonthRevenue / projectedRevenue) * 100 : 0;

      // 월별 통계 (최근 6개월)
      const byMonth = [];
      let previousRevenue = 0;
      const growthRates: number[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
        const monthLast = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: monthPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'confirmed')
          .gte('payment_date', monthFirst)
          .lte('payment_date', monthLast);

        const revenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const projected = projectedRevenue; // 간단화를 위해 동일 값 사용

        const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
        if (previousRevenue > 0) {
          growthRates.push(growth);
        }

        byMonth.push({
          month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          revenue,
          projected,
          difference: revenue - projected,
          growth: Math.round(growth * 10) / 10,
        });

        previousRevenue = revenue;
      }

      // 수업별 매출 기여도
      const { data: paymentsByCourse } = await supabase
        .from('payments')
        .select('course_id, amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const courseRevenue: Record<string, number> = {};
      paymentsByCourse?.forEach(p => {
        courseRevenue[p.course_id] = (courseRevenue[p.course_id] || 0) + p.amount;
      });

      const byCourse = courses?.map(course => ({
        courseId: course.id,
        courseName: course.name,
        revenue: courseRevenue[course.id] || 0,
        contribution: thisMonthRevenue > 0 ? ((courseRevenue[course.id] || 0) / thisMonthRevenue) * 100 : 0,
        enrollment: enrollmentCounts[course.id] || 0,
      })).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue) || [];

      // 결제 방법별 통계
      const { data: paymentsByMethod } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('status', 'confirmed')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      const byPaymentMethod: Record<string, { amount: number; percentage: number }> = {};
      paymentsByMethod?.forEach(p => {
        if (!byPaymentMethod[p.payment_method]) {
          byPaymentMethod[p.payment_method] = { amount: 0, percentage: 0 };
        }
        byPaymentMethod[p.payment_method].amount += p.amount;
      });

      Object.keys(byPaymentMethod).forEach(method => {
        byPaymentMethod[method].percentage = thisMonthRevenue > 0
          ? (byPaymentMethod[method].amount / thisMonthRevenue) * 100
          : 0;
      });

      // 성장률 추이
      const currentGrowth = byMonth.length > 1
        ? byMonth[byMonth.length - 1].growth
        : 0;
      const averageMonthlyGrowth = growthRates.length > 0
        ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
        : 0;

      setStats({
        totalRevenue,
        projectedRevenue,
        actualVsProjected: Math.round(actualVsProjected * 10) / 10,
        byMonth,
        byCourse,
        byPaymentMethod,
        trend: {
          growth: Math.round(currentGrowth * 10) / 10,
          averageMonthlyGrowth: Math.round(averageMonthlyGrowth * 10) / 10,
        },
      });
    } catch (error) {
      console.error('매출 분석 조회 오류:', error);
      alert('매출 분석을 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">매출 분석</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">전체 매출</p>
              <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}원</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">예상 매출</p>
              <p className="text-3xl font-bold">{stats.projectedRevenue.toLocaleString()}원</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">실제 대비 예상</p>
              <p className="text-3xl font-bold">{stats.actualVsProjected}%</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">평균 월 성장률</p>
              <p className={`text-3xl font-bold ${stats.trend.averageMonthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.trend.averageMonthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.trend.averageMonthlyGrowth)}%
              </p>
            </div>
          </div>

          {/* 월별 추이 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">월별 매출 추이</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">월</th>
                    <th className="text-right p-2">실제 매출</th>
                    <th className="text-right p-2">예상 매출</th>
                    <th className="text-right p-2">차이</th>
                    <th className="text-right p-2">성장률</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byMonth.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.month}</td>
                      <td className="text-right p-2 font-semibold">{item.revenue.toLocaleString()}원</td>
                      <td className="text-right p-2">{item.projected.toLocaleString()}원</td>
                      <td className={`text-right p-2 ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.difference >= 0 ? '+' : ''}{item.difference.toLocaleString()}원
                      </td>
                      <td className={`text-right p-2 ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 수업별 매출 기여도 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">수업별 매출 기여도</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">수업명</th>
                    <th className="text-right p-2">매출액</th>
                    <th className="text-right p-2">기여도</th>
                    <th className="text-right p-2">수강생 수</th>
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
                      <td className="text-right p-2">
                        {Math.round(course.contribution * 10) / 10}%
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 ml-auto">
                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{ width: `${course.contribution}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="text-right p-2">{course.enrollment}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 결제 방법별 매출 분포 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">결제 방법별 매출 분포</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
                <div key={method} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{PAYMENT_METHODS[method] || method}</p>
                  <p className="text-2xl font-bold mt-2">{data.amount.toLocaleString()}원</p>
                  <p className="text-sm text-gray-500 mt-1">{Math.round(data.percentage * 10) / 10}%</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

