'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import { LearningLog } from '@/types/learning-log';
import { Attendance } from '@/types/attendance';
import { useAuth } from '@/hooks/useAuth';
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

function StudentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';
  const { user } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'thisMonth' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchStudent(params.id as string);
      if (activeTab === 'learning-logs') {
        fetchLearningLogs(params.id as string);
      } else if (activeTab === 'attendance') {
        fetchAttendances(params.id as string);
      }
    }
  }, [params.id, activeTab]);

  const fetchStudent = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // 마지막 수업일이 현재 날짜보다 이전이면 자동으로 그만둔 상태로 변경
      const { autoUpdateStudentStatusIfNeeded } = await import('@/lib/utils/student-status');
      const statusUpdated = await autoUpdateStudentStatusIfNeeded(
        id,
        data.status,
        data.last_class_date
      );
      
      if (statusUpdated) {
        // 업데이트 후 다시 조회
        const { data: updatedData, error: updatedError } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!updatedError) {
          setStudent(updatedData);
        } else {
          setStudent(data);
        }
      } else {
        setStudent(data);
      }
    } catch (error) {
      console.error('학생 조회 오류:', error);
      alert('학생 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/students');
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningLogs = async (studentId: string) => {
    try {
      setLogsLoading(true);
      // 학생이 수강하는 수업 조회
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setLearningLogs([]);
        setLogsLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // 해당 수업들의 학습일지 조회
      const { data, error } = await supabase
        .from('learning_logs')
        .select(`
          *,
          courses:course_id (
            name,
            subject
          ),
          instructors:instructor_id (
            name
          )
        `)
        .in('course_id', courseIds)
        .order('date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('학습일지 조회 오류:', error);
        throw error;
      }

      // 학생 상세 페이지에서는 항상 해당 학생의 코멘트만 표시
      const logsWithNames = (data || []).map((log: any) => {
        // 해당 학생의 코멘트만 필터링
        let filteredComments = {};
        if (log.student_comments && log.student_comments[studentId]) {
          filteredComments = { [studentId]: log.student_comments[studentId] };
        }

        return {
          ...log,
          course_name: log.courses?.name,
          instructor_name: log.instructors?.name,
          student_comments: filteredComments,
        };
      });

      setLearningLogs(logsWithNames);
    } catch (error) {
      console.error('학습일지 조회 오류:', error);
      alert('학습일지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchAttendances = async (studentId: string) => {
    try {
      setAttendanceLoading(true);
      let query = supabase
        .from('attendance')
        .select(`
          *,
          courses(name, subject)
        `)
        .eq('student_id', studentId);

      // 필터 적용
      if (attendanceFilter === 'thisMonth') {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        query = query.gte('date', firstDayOfMonth).lte('date', lastDayOfMonth);
      } else if (attendanceFilter === 'custom' && startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      const attendancesWithNames = (data || []).map((attendance: any) => ({
        ...attendance,
        course_name: attendance.courses?.name,
      }));

      setAttendances(attendancesWithNames);
    } catch (error) {
      console.error('출석 기록 조회 오류:', error);
      alert('출석 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && params.id) {
      fetchAttendances(params.id as string);
    }
  }, [attendanceFilter, startDate, endDate]);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      alert('학생이 삭제되었습니다.');
      router.push('/students');
    } catch (error) {
      console.error('학생 삭제 오류:', error);
      alert('학생 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!student) {
    return <div className="text-center py-8">학생을 찾을 수 없습니다.</div>;
  }

  // 이번 달 출석 통계
  const getThisMonthStats = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const thisMonth = attendances.filter(a => 
      a.date >= firstDayOfMonth && a.date <= lastDayOfMonth
    );

    return {
      present: thisMonth.filter(a => a.status === 'present').length,
      late: thisMonth.filter(a => a.status === 'late').length,
      absent: thisMonth.filter(a => a.status === 'absent').length,
      early: thisMonth.filter(a => a.status === 'early').length,
      total: thisMonth.length,
    };
  };

  // 전체 출석 통계
  const getAllStats = () => {
    return {
      present: attendances.filter(a => a.status === 'present').length,
      late: attendances.filter(a => a.status === 'late').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      early: attendances.filter(a => a.status === 'early').length,
      total: attendances.length,
    };
  };

  const thisMonthStats = getThisMonthStats();
  const allStats = getAllStats();

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학생 상세 정보</h1>
        <div className="flex gap-2">
          <Link href={`/students/${params.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => router.push(`/students/${params.id}`)}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'info'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          기본 정보
        </button>
        <button
          onClick={() => router.push(`/students/${params.id}?tab=attendance`)}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'attendance'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          출석 기록
        </button>
        <button
          onClick={() => router.push(`/students/${params.id}?tab=learning-logs`)}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'learning-logs'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          학습일지
        </button>
      </div>

      {/* 기본 정보 탭 */}
      {activeTab === 'info' && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="text-sm font-medium text-gray-500">상태</label>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                student.status === 'inactive' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {student.status === 'inactive' ? '그만둔 학생' : '재학생'}
              </span>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">이름</label>
          <p className="text-lg font-semibold mt-1">{student.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">전화번호</label>
          <p className="text-lg mt-1">{student.phone}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">이메일</label>
          <p className="text-lg mt-1">{student.email || '-'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">주소</label>
          <p className="text-lg mt-1">{student.address || '-'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">보호자 이름</label>
          <p className="text-lg mt-1">{student.guardian_name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">보호자 전화번호</label>
          <p className="text-lg mt-1">{student.guardian_phone}</p>
        </div>

        {student.first_class_date && (
          <div>
            <label className="text-sm font-medium text-gray-500">첫 수업일</label>
            <p className="text-lg mt-1">
              {new Date(student.first_class_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}

        {student.status === 'inactive' && student.last_class_date && (
          <div>
            <label className="text-sm font-medium text-gray-500">마지막 수업일자</label>
            <p className="text-lg mt-1">
              {new Date(student.last_class_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-500">등록일</label>
          <p className="text-lg mt-1">
            {new Date(student.created_at).toLocaleString('ko-KR')}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">수정일</label>
          <p className="text-lg mt-1">
            {new Date(student.updated_at).toLocaleString('ko-KR')}
          </p>
        </div>
        </div>
      )}

      {/* 출석 기록 탭 */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* 필터 선택 */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => {
                  setAttendanceFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  attendanceFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setAttendanceFilter('thisMonth');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  attendanceFilter === 'thisMonth'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                이번 달
              </button>
              <button
                onClick={() => setAttendanceFilter('custom')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  attendanceFilter === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                기간 설정
              </button>
            </div>

            {attendanceFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
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
            )}
          </div>

          {/* 출석 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이번 달 통계 */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">이번 달 출석 통계</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-green-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-green-600">{thisMonthStats.present}</div>
                  <div className="text-xs text-gray-500">출석</div>
                </div>
                <div className="text-center bg-yellow-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-yellow-600">{thisMonthStats.late}</div>
                  <div className="text-xs text-gray-500">지각</div>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-red-600">{thisMonthStats.absent}</div>
                  <div className="text-xs text-gray-500">결석</div>
                </div>
                <div className="text-center bg-orange-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-orange-600">{thisMonthStats.early}</div>
                  <div className="text-xs text-gray-500">조퇴</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-center">
                총 {thisMonthStats.total}건
              </div>
            </div>

            {/* 전체 통계 */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">전체 출석 통계</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-green-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-green-600">{allStats.present}</div>
                  <div className="text-xs text-gray-500">출석</div>
                </div>
                <div className="text-center bg-yellow-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-yellow-600">{allStats.late}</div>
                  <div className="text-xs text-gray-500">지각</div>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-red-600">{allStats.absent}</div>
                  <div className="text-xs text-gray-500">결석</div>
                </div>
                <div className="text-center bg-orange-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-orange-600">{allStats.early}</div>
                  <div className="text-xs text-gray-500">조퇴</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-center">
                총 {allStats.total}건
              </div>
            </div>
          </div>

          {/* 출석 기록 테이블 */}
          {attendanceLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              출석 기록이 없습니다.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>수업명</TableHead>
                    <TableHead>출석 상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>
                        {new Date(attendance.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {attendance.course_name || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[attendance.status]}`}>
                          {STATUS_LABELS[attendance.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* 학습일지 탭 */}
      {activeTab === 'learning-logs' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">학습일지</h2>
          {logsLoading ? (
            <div className="text-center py-4">로딩 중...</div>
          ) : learningLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              등록된 학습일지가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {learningLogs.map((log) => (
                <div key={log.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{log.course_name || '-'}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(log.date).toLocaleDateString('ko-KR')} | 작성자: {log.instructor_name || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">학습 내용</label>
                      <div className="text-sm mt-1">
                        <p className="whitespace-pre-wrap">
                          {log.content}
                          {log.student_comments && Object.keys(log.student_comments).length > 0 && (
                            <>
                              {Object.entries(log.student_comments).map(([studentId, comment]) => (
                                <span key={studentId}>
                                  {'\n\n'}
                                  {comment as string}
                                </span>
                              ))}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {log.homework && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">숙제</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{log.homework}</p>
                      </div>
                    )}
                    {log.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">특이사항</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{log.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link href="/students">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">로딩 중...</div>}>
      <StudentDetailContent />
    </Suspense>
  );
}

