'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';
import Link from 'next/link';

interface AttendanceStatistics {
  overall: {
    attendanceRate: number;
    totalSessions: number;
    present: number;
    late: number;
    absent: number;
    early: number;
  };
  byMonth: Array<{
    month: string;
    attendanceRate: number;
    totalSessions: number;
    present: number;
    late: number;
    absent: number;
    early: number;
  }>;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    attendanceRate: number;
    totalSessions: number;
    present: number;
    late: number;
    absent: number;
    early: number;
  }>;
  byStatus: {
    present: number;
    late: number;
    absent: number;
    early: number;
  };
  topStudents: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    totalSessions: number;
    present: number;
  }>;
  lowAttendanceStudents: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    totalSessions: number;
    present: number;
    absent: number;
  }>;
}

export default function AttendanceStatisticsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [stats, setStats] = useState<AttendanceStatistics | null>(null);
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

      // 전체 출석 데이터
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      const totalSessions = attendanceData?.length || 0;
      const present = attendanceData?.filter(a => a.status === 'present').length || 0;
      const late = attendanceData?.filter(a => a.status === 'late').length || 0;
      const absent = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const early = attendanceData?.filter(a => a.status === 'early').length || 0;
      // 출석률 계산: 결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주
      const attendanceRate = totalSessions > 0 ? ((present + late + early) / totalSessions) * 100 : 0;

      // 월별 통계 (최근 6개월)
      const byMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
        const monthLast = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: monthAttendance } = await supabase
          .from('attendance')
          .select('status')
          .gte('date', monthFirst)
          .lte('date', monthLast);

        const monthTotal = monthAttendance?.length || 0;
        const monthPresent = monthAttendance?.filter(a => a.status === 'present').length || 0;
        const monthLate = monthAttendance?.filter(a => a.status === 'late').length || 0;
        const monthAbsent = monthAttendance?.filter(a => a.status === 'absent').length || 0;
        const monthEarly = monthAttendance?.filter(a => a.status === 'early').length || 0;
        // 출석률 계산: 결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주
        const monthRate = monthTotal > 0 ? ((monthPresent + monthLate + monthEarly) / monthTotal) * 100 : 0;

        byMonth.push({
          month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          attendanceRate: Math.round(monthRate * 10) / 10,
          totalSessions: monthTotal,
          present: monthPresent,
          late: monthLate,
          absent: monthAbsent,
          early: monthEarly,
        });
      }

      // 수업별 통계
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name');

      const { data: attendanceByCourse } = await supabase
        .from('attendance')
        .select('course_id, status')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      const byCourse: Array<{
        courseId: string;
        courseName: string;
        attendanceRate: number;
        totalSessions: number;
        present: number;
        late: number;
        absent: number;
        early: number;
      }> = [];

      courses?.forEach(course => {
        const courseAttendance = attendanceByCourse?.filter(a => a.course_id === course.id) || [];
        const courseTotal = courseAttendance.length;
        const coursePresent = courseAttendance.filter(a => a.status === 'present').length;
        const courseLate = courseAttendance.filter(a => a.status === 'late').length;
        const courseAbsent = courseAttendance.filter(a => a.status === 'absent').length;
        const courseEarly = courseAttendance.filter(a => a.status === 'early').length;
        // 출석률 계산: 결석만 제외, 출석/지각/조퇴는 모두 출석으로 간주
        const courseRate = courseTotal > 0 ? ((coursePresent + courseLate + courseEarly) / courseTotal) * 100 : 0;

        if (courseTotal > 0) {
          byCourse.push({
            courseId: course.id,
            courseName: course.name,
            attendanceRate: Math.round(courseRate * 10) / 10,
            totalSessions: courseTotal,
            present: coursePresent,
            late: courseLate,
            absent: courseAbsent,
            early: courseEarly,
          });
        }
      });

      byCourse.sort((a, b) => b.attendanceRate - a.attendanceRate);

      // 학생별 출석률 계산
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, name');

      const { data: attendanceByStudent } = await supabase
        .from('attendance')
        .select('student_id, status')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      const studentStats: Array<{
        studentId: string;
        studentName: string;
        attendanceRate: number;
        totalSessions: number;
        present: number;
        absent: number;
      }> = [];

      allStudents?.forEach(student => {
        const studentAttendance = attendanceByStudent?.filter(a => a.student_id === student.id) || [];
        const studentTotal = studentAttendance.length;
        const studentPresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const studentAbsent = studentAttendance.filter(a => a.status === 'absent').length;
        const studentRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 100;

        if (studentTotal > 0) {
          studentStats.push({
            studentId: student.id,
            studentName: student.name,
            attendanceRate: Math.round(studentRate * 10) / 10,
            totalSessions: studentTotal,
            present: studentPresent,
            absent: studentAbsent,
          });
        }
      });

      studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);
      const topStudents = studentStats.slice(0, 5);
      const lowAttendanceStudents = studentStats.filter(s => s.attendanceRate < 70).slice(0, 10);

      setStats({
        overall: {
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          totalSessions,
          present,
          late,
          absent,
          early,
        },
        byMonth,
        byCourse,
        byStatus: {
          present,
          late,
          absent,
          early,
        },
        topStudents,
        lowAttendanceStudents,
      });
    } catch (error) {
      console.error('출석률 통계 조회 오류:', error);
      alert('출석률 통계를 불러오는 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">출석률 통계</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">전체 출석률</p>
              <p className="text-3xl font-bold">{stats.overall.attendanceRate}%</p>
              <p className="text-sm text-gray-500 mt-2">{stats.overall.totalSessions}회</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">출석</p>
              <p className="text-3xl font-bold text-green-600">{stats.overall.present}회</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">지각</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.overall.late}회</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">결석</p>
              <p className="text-3xl font-bold text-red-600">{stats.overall.absent}회</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">조퇴</p>
              <p className="text-3xl font-bold text-orange-600">{stats.overall.early}회</p>
            </div>
          </div>

          {/* 월별 추이 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">월별 출석률 추이</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">월</th>
                    <th className="text-right p-2">출석률</th>
                    <th className="text-right p-2">전체</th>
                    <th className="text-right p-2">출석</th>
                    <th className="text-right p-2">지각</th>
                    <th className="text-right p-2">결석</th>
                    <th className="text-right p-2">조퇴</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byMonth.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.month}</td>
                      <td className="text-right p-2 font-semibold">{item.attendanceRate}%</td>
                      <td className="text-right p-2">{item.totalSessions}회</td>
                      <td className="text-right p-2 text-green-600">{item.present}회</td>
                      <td className="text-right p-2 text-yellow-600">{item.late}회</td>
                      <td className="text-right p-2 text-red-600">{item.absent}회</td>
                      <td className="text-right p-2 text-orange-600">{item.early}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 수업별 통계 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">수업별 출석률</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">수업명</th>
                    <th className="text-right p-2">출석률</th>
                    <th className="text-right p-2">전체</th>
                    <th className="text-right p-2">출석</th>
                    <th className="text-right p-2">지각</th>
                    <th className="text-right p-2">결석</th>
                    <th className="text-right p-2">조퇴</th>
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
                      <td className="text-right p-2 font-semibold">{course.attendanceRate}%</td>
                      <td className="text-right p-2">{course.totalSessions}회</td>
                      <td className="text-right p-2 text-green-600">{course.present}회</td>
                      <td className="text-right p-2 text-yellow-600">{course.late}회</td>
                      <td className="text-right p-2 text-red-600">{course.absent}회</td>
                      <td className="text-right p-2 text-orange-600">{course.early}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 우수 학생 */}
          {stats.topStudents.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">출석률 우수 학생</h2>
              <div className="space-y-2">
                {stats.topStudents.map((student, index) => (
                  <Link
                    key={student.studentId}
                    href={`/students/${student.studentId}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-gray-500">{student.totalSessions}회 중 {student.present}회 출석</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{student.attendanceRate}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 출석률 낮은 학생 */}
          {stats.lowAttendanceStudents.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">출석률 낮은 학생 (70% 미만)</h2>
              <div className="space-y-2">
                {stats.lowAttendanceStudents.map((student) => (
                  <Link
                    key={student.studentId}
                    href={`/students/${student.studentId}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-gray-500">
                        {student.totalSessions}회 중 {student.present}회 출석, {student.absent}회 결석
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{student.attendanceRate}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

