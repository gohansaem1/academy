'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  early: number;
  attendanceRate: number;
}

export default function AttendanceStatisticsPage() {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('id, name')
        .order('name');
      setStudents(data || []);
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, name')
        .order('name');
      setCourses(data || []);
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
    }
  };

  const fetchStatistics = async () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select('status', { count: 'exact' });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data?.length || 0;
      const present = data?.filter(a => a.status === 'present').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const early = data?.filter(a => a.status === 'early').length || 0;
      const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

      setStats({
        total,
        present,
        late,
        absent,
        early,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      });
    } catch (error) {
      console.error('출석 통계 조회 오류:', error);
      alert('출석 통계를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">출석 통계</h1>

      <div className="bg-white border rounded-lg p-6 space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">학생 선택 (선택사항)</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">수업 선택 (선택사항)</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="시작일"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            label="종료일"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <button
          onClick={fetchStatistics}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '통계 조회'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">전체</p>
            <p className="text-3xl font-bold">{stats.total}회</p>
          </div>

          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">출석</p>
            <p className="text-3xl font-bold text-green-600">{stats.present}회</p>
          </div>

          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">지각</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.late}회</p>
          </div>

          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">결석</p>
            <p className="text-3xl font-bold text-red-600">{stats.absent}회</p>
          </div>

          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">조퇴</p>
            <p className="text-3xl font-bold text-orange-600">{stats.early}회</p>
          </div>

          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">출석률</p>
            <p className="text-3xl font-bold text-blue-600">{stats.attendanceRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

