'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import { Attendance } from '@/types/attendance';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const STATUS_LABELS = {
  present: '출석',
  late: '지각',
  absent: '결석',
  early: '조퇴',
};

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 border-green-300',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  absent: 'bg-red-100 text-red-800 border-red-300',
  early: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function NewAttendancePage() {
  const { user, loading: authLoading } = useAuth('TEACHER');
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Attendance>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchCoursesForDate();
    }
  }, [authLoading, selectedDate]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrolledStudents(selectedCourseId);
      fetchExistingAttendance(selectedCourseId);
    } else {
      setStudents([]);
      setAttendanceRecords({});
    }
  }, [selectedCourseId, selectedDate]);

  // 선택한 날짜의 요일에 해당하는 수업 조회
  const fetchCoursesForDate = async () => {
    try {
      setLoading(true);
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;

      // 해당 날짜의 요일에 수업이 있는지 확인
      const coursesForDate = (data || []).filter(course => {
        if (course.schedule && Array.isArray(course.schedule) && course.schedule.length > 0) {
          // 새로운 schedule 필드 사용
          return course.schedule.some(s => s.day_of_week === dayOfWeek);
        } else {
          // 기존 day_of_week 필드 사용 (하위 호환성)
          return course.day_of_week === dayOfWeek;
        }
      });

      setCourses(coursesForDate);
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
      alert('수업 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수업에 등록된 학생 조회
  const fetchEnrolledStudents = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          students(*)
        `)
        .eq('course_id', courseId)
        .order('students(name)', { ascending: true });

      if (error) throw error;
      const enrolledStudents = (data || []).map((item: any) => item.students).filter(Boolean);
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
    }
  };

  // 기존 출석 기록 조회
  const fetchExistingAttendance = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('course_id', courseId)
        .eq('date', selectedDate);

      if (error) throw error;

      const records: Record<string, Attendance> = {};
      (data || []).forEach((record: Attendance) => {
        records[record.student_id] = record;
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error('기존 출석 기록 조회 오류:', error);
    }
  };

  // 출석 상태 변경
  const handleStatusChange = (studentId: string, status: 'present' | 'late' | 'absent' | 'early') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        course_id: selectedCourseId!,
        date: selectedDate,
        status,
      } as Attendance,
    }));
  };

  // 출석 기록 저장
  const handleSave = async () => {
    if (!selectedCourseId) {
      alert('수업을 선택해주세요.');
      return;
    }

    if (students.length === 0) {
      alert('등록된 학생이 없습니다.');
      return;
    }

    try {
      setSaving(true);

      // 모든 학생의 출석 상태 확인
      const recordsToSave = students.map(student => {
        const existingRecord = attendanceRecords[student.id];
        const status = existingRecord?.status || 'absent'; // 기본값: 결석

        return {
          course_id: selectedCourseId,
          student_id: student.id,
          date: selectedDate,
          status,
        };
      });

      // 기존 기록 삭제 후 새로 삽입 (upsert 대신)
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('course_id', selectedCourseId)
        .eq('date', selectedDate);

      if (deleteError) throw deleteError;

      // 새 기록 삽입
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(recordsToSave);

      if (insertError) throw insertError;

      alert('출석이 기록되었습니다.');
      router.push('/attendance');
    } catch (error: any) {
      console.error('출석 기록 오류:', error);
      alert('출석 기록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">출석 체크</h1>

      {/* 날짜 선택 */}
      <div className="mb-6">
        <Input
          label="날짜 선택"
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedCourseId(null);
          }}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          선택한 날짜에 진행되는 수업이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {/* 수업 카드 목록 */}
          {!selectedCourseId && (
            <div>
              <h2 className="text-xl font-semibold mb-4">수업 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => {
                  const schedule = course.schedule && course.schedule.length > 0
                    ? course.schedule.find(s => {
                        const date = new Date(selectedDate);
                        return s.day_of_week === date.getDay();
                      })
                    : null;
                  const timeDisplay = schedule
                    ? `${schedule.start_time} ~ ${schedule.end_time}`
                    : `${course.start_time} ~ ${course.end_time}`;

                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {course.subject}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{timeDisplay}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 학생 출석 체크 */}
          {selectedCourseId && selectedCourse && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedCourse.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCourseId(null)}
                >
                  수업 선택으로 돌아가기
                </Button>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 학생이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b">
                      <div className="font-semibold">학생명</div>
                      <div className="font-semibold text-center">출석</div>
                      <div className="font-semibold text-center">지각</div>
                      <div className="font-semibold text-center">결석</div>
                      <div className="font-semibold text-center">조퇴</div>
                    </div>
                    {students.map((student) => {
                      const currentStatus = attendanceRecords[student.id]?.status || 'absent';
                      return (
                        <div key={student.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'present')}
                              className={`w-full py-2 px-4 rounded border transition-colors ${
                                currentStatus === 'present'
                                  ? STATUS_COLORS.present
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {STATUS_LABELS.present}
                            </button>
                          </div>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'late')}
                              className={`w-full py-2 px-4 rounded border transition-colors ${
                                currentStatus === 'late'
                                  ? STATUS_COLORS.late
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {STATUS_LABELS.late}
                            </button>
                          </div>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'absent')}
                              className={`w-full py-2 px-4 rounded border transition-colors ${
                                currentStatus === 'absent'
                                  ? STATUS_COLORS.absent
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {STATUS_LABELS.absent}
                            </button>
                          </div>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'early')}
                              className={`w-full py-2 px-4 rounded border transition-colors ${
                                currentStatus === 'early'
                                  ? STATUS_COLORS.early
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {STATUS_LABELS.early}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? '저장 중...' : '출석 저장'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
