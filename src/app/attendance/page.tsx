'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Attendance } from '@/types/attendance';
import { Student } from '@/types/student';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

const STATUS_LABELS = {
  present: '출석',
  late: '지각',
  absent: '결석',
  early: '조퇴',
};

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-red-100 text-red-800',
  early: 'bg-orange-100 text-orange-800',
};

interface RecentAbsentStudent {
  student_id: string;
  student_name: string;
  course_name: string;
  date: string;
  status: string;
}

interface RecentLateStudent {
  student_id: string;
  student_name: string;
  course_name: string;
  date: string;
  status: string;
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [recentAbsentStudents, setRecentAbsentStudents] = useState<RecentAbsentStudent[]>([]);
  const [recentLateStudents, setRecentLateStudents] = useState<RecentLateStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendances();
    fetchRecentAbsentStudents();
    fetchRecentLateStudents();
  }, [selectedDate]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          courses(name),
          students(name)
        `)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const attendancesWithNames = (data || []).map((attendance: any) => ({
        ...attendance,
        course_name: attendance.courses?.name,
        student_name: attendance.students?.name,
      }));

      setAttendances(attendancesWithNames);
    } catch (error) {
      console.error('출석 기록 조회 오류:', error);
      alert('출석 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 최근 결석 학생 조회 (최근 7일)
  const fetchRecentAbsentStudents = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          student_id,
          date,
          status,
          courses(name),
          students(name)
        `)
        .eq('status', 'absent')
        .gte('date', dateStr)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const absentStudents = (data || []).map((item: any) => ({
        student_id: item.student_id,
        student_name: item.students?.name || '-',
        course_name: item.courses?.name || '-',
        date: item.date,
        status: item.status,
      }));

      setRecentAbsentStudents(absentStudents);
    } catch (error) {
      console.error('최근 결석 학생 조회 오류:', error);
    }
  };

  // 최근 지각 학생 조회 (최근 7일)
  const fetchRecentLateStudents = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          student_id,
          date,
          status,
          courses(name),
          students(name)
        `)
        .eq('status', 'late')
        .gte('date', dateStr)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const lateStudents = (data || []).map((item: any) => ({
        student_id: item.student_id,
        student_name: item.students?.name || '-',
        course_name: item.courses?.name || '-',
        date: item.date,
        status: item.status,
      }));

      setRecentLateStudents(lateStudents);
    } catch (error) {
      console.error('최근 지각 학생 조회 오류:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'present' | 'late' | 'absent' | 'early') => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      fetchAttendances();
      fetchRecentAbsentStudents();
      fetchRecentLateStudents();
    } catch (error) {
      console.error('출석 상태 변경 오류:', error);
      alert('출석 상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">출석 관리</h1>
        <Link href="/attendance/new">
          <Button>출석 체크</Button>
        </Link>
      </div>

      {/* 최근 결석/지각 학생 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 최근 결석 학생 */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-red-600">최근 결석 학생 (최근 7일)</h2>
          {recentAbsentStudents.length === 0 ? (
            <p className="text-sm text-gray-500">결석 학생이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recentAbsentStudents.slice(0, 5).map((student, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{student.student_name}</span>
                    <span className="text-gray-500 ml-2">({student.course_name})</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(student.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 지각 학생 */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-yellow-600">최근 지각 학생 (최근 7일)</h2>
          {recentLateStudents.length === 0 ? (
            <p className="text-sm text-gray-500">지각 학생이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recentLateStudents.slice(0, 5).map((student, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{student.student_name}</span>
                    <span className="text-gray-500 ml-2">({student.course_name})</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(student.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 날짜별 출석 기록 */}
      <div className="mb-4">
        <Input
          label="날짜 선택"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : attendances.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          선택한 날짜의 출석 기록이 없습니다.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수업명</TableHead>
                <TableHead>학생명</TableHead>
                <TableHead>출석 상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">
                    {attendance.course_name || '-'}
                  </TableCell>
                  <TableCell>{attendance.student_name || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[attendance.status]}`}>
                      {STATUS_LABELS[attendance.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant={attendance.status === 'present' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(attendance.id, 'present')}
                      >
                        출석
                      </Button>
                      <Button
                        size="sm"
                        variant={attendance.status === 'late' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(attendance.id, 'late')}
                      >
                        지각
                      </Button>
                      <Button
                        size="sm"
                        variant={attendance.status === 'absent' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(attendance.id, 'absent')}
                      >
                        결석
                      </Button>
                      <Button
                        size="sm"
                        variant={attendance.status === 'early' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(attendance.id, 'early')}
                      >
                        조퇴
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
