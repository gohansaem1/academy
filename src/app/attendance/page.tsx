'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Attendance } from '@/types/attendance';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

const STATUS_LABELS = {
  present: '출석',
  late: '지각',
  absent: '결석',
};

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-red-100 text-red-800',
};

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendances();
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

  const handleStatusChange = async (id: string, newStatus: 'present' | 'late' | 'absent') => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAttendances();
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

