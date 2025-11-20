'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface CourseStatistics {
  total: number;
  activeCourses: number;
  averageEnrollment: number;
  averageCapacity: number;
  enrollmentRate: number;
  bySubject: Record<string, {
    count: number;
    totalEnrollment: number;
    averageEnrollment: number;
  }>;
  byDayOfWeek: Record<string, number>;
  byTimeSlot: Record<string, number>;
  popularCourses: Array<{
    courseId: string;
    courseName: string;
    enrollment: number;
    capacity: number;
    enrollmentRate: number;
  }>;
}

export default function CourseStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchStatistics();
    }
  }, [authLoading]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // 전체 수업 수
      const { count: total, data: courses } = await supabase
        .from('courses')
        .select('*');

      const activeCourses = courses?.length || 0;

      // 수업별 등록 학생 수
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id');

      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });

      const totalEnrollments = Object.values(enrollmentCounts).reduce((sum, count) => sum + count, 0);
      const averageEnrollment = activeCourses > 0 ? totalEnrollments / activeCourses : 0;

      // 평균 정원
      const totalCapacity = courses?.reduce((sum, c) => sum + c.capacity, 0) || 0;
      const averageCapacity = activeCourses > 0 ? totalCapacity / activeCourses : 0;

      // 등록률
      const enrollmentRate = averageCapacity > 0 ? (averageEnrollment / averageCapacity) * 100 : 0;

      // 과목별 통계
      const bySubject: Record<string, { count: number; totalEnrollment: number; averageEnrollment: number }> = {};
      courses?.forEach(course => {
        if (!bySubject[course.subject]) {
          bySubject[course.subject] = {
            count: 0,
            totalEnrollment: 0,
            averageEnrollment: 0,
          };
        }
        bySubject[course.subject].count++;
        bySubject[course.subject].totalEnrollment += enrollmentCounts[course.id] || 0;
      });

      Object.keys(bySubject).forEach(subject => {
        bySubject[subject].averageEnrollment = bySubject[subject].totalEnrollment / bySubject[subject].count;
      });

      // 요일별 분포
      const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const byDayOfWeek: Record<string, number> = {};
      courses?.forEach(course => {
        const dayName = DAYS_OF_WEEK[course.day_of_week];
        byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + 1;
      });

      // 시간대별 분포
      const byTimeSlot: Record<string, number> = {};
      courses?.forEach(course => {
        const startHour = parseInt(course.start_time.split(':')[0]);
        let slot = '';
        if (startHour < 12) {
          slot = '09:00-12:00';
        } else if (startHour < 16) {
          slot = '13:00-16:00';
        } else {
          slot = '16:00-19:00';
        }
        byTimeSlot[slot] = (byTimeSlot[slot] || 0) + 1;
      });

      // 인기 수업 (등록률 기준)
      const popularCourses = courses?.map(course => ({
        courseId: course.id,
        courseName: course.name,
        enrollment: enrollmentCounts[course.id] || 0,
        capacity: course.capacity,
        enrollmentRate: course.capacity > 0 ? ((enrollmentCounts[course.id] || 0) / course.capacity) * 100 : 0,
      })).sort((a, b) => b.enrollmentRate - a.enrollmentRate).slice(0, 5) || [];

      setStats({
        total: total || 0,
        activeCourses,
        averageEnrollment: Math.round(averageEnrollment * 10) / 10,
        averageCapacity: Math.round(averageCapacity * 10) / 10,
        enrollmentRate: Math.round(enrollmentRate * 10) / 10,
        bySubject,
        byDayOfWeek,
        byTimeSlot,
        popularCourses,
      });
    } catch (error) {
      console.error('수업 통계 조회 오류:', error);
      alert('수업 통계를 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">수업 현황 통계</h1>
      </div>

      {stats && (
        <>
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">전체 수업 수</p>
              <p className="text-3xl font-bold">{stats.total}개</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">활성 수업 수</p>
              <p className="text-3xl font-bold">{stats.activeCourses}개</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">평균 수강 인원</p>
              <p className="text-3xl font-bold">{stats.averageEnrollment}명</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">평균 정원 대비 등록률</p>
              <p className="text-3xl font-bold">{stats.enrollmentRate}%</p>
            </div>
          </div>

          {/* 과목별 통계 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">과목별 통계</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">과목</th>
                    <th className="text-right p-2">수업 수</th>
                    <th className="text-right p-2">총 수강생</th>
                    <th className="text-right p-2">평균 수강생</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.bySubject).map(([subject, data]) => (
                    <tr key={subject} className="border-b">
                      <td className="p-2 font-medium">{subject}</td>
                      <td className="text-right p-2">{data.count}개</td>
                      <td className="text-right p-2">{data.totalEnrollment}명</td>
                      <td className="text-right p-2">{Math.round(data.averageEnrollment * 10) / 10}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 요일별 분포 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">요일별 수업 분포</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byDayOfWeek).map(([day, count]) => (
                <div key={day} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{day}</p>
                  <p className="text-2xl font-bold mt-2">{count}개</p>
                </div>
              ))}
            </div>
          </div>

          {/* 시간대별 분포 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">시간대별 수업 분포</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.byTimeSlot).map(([slot, count]) => (
                <div key={slot} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{slot}</p>
                  <p className="text-2xl font-bold mt-2">{count}개</p>
                </div>
              ))}
            </div>
          </div>

          {/* 인기 수업 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">인기 수업 (등록률 기준)</h2>
            <div className="space-y-2">
              {stats.popularCourses.map((course, index) => (
                <Link
                  key={course.courseId}
                  href={`/courses/${course.courseId}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{course.courseName}</p>
                      <p className="text-sm text-gray-500">
                        {course.enrollment}명 / {course.capacity}명
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Math.round(course.enrollmentRate)}%</p>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${course.enrollmentRate}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

