'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import { LearningLogFormData, LearningLog } from '@/types/learning-log';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const ITEMS_PER_PAGE = 12; // 한 페이지에 표시할 카드 수

export default function LearningLogsPage() {
  const { user, loading: authLoading } = useAuth('TEACHER');
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [existingLog, setExistingLog] = useState<LearningLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LearningLogFormData>({
    course_id: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    homework: '',
    notes: '',
    student_comments: {},
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LearningLogFormData, string>>>({});
  
  // 학습일지 목록 관련 상태
  const [allLearningLogs, setAllLearningLogs] = useState<LearningLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showListView, setShowListView] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ date: string; courseId: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchCoursesForDate();
      if (showListView) {
        fetchAllLearningLogs();
      }
    }
  }, [authLoading, selectedDate, showListView]);

  // 목록보기에서 수정 버튼 클릭 시 처리
  useEffect(() => {
    if (!showListView && pendingEdit && courses.length > 0) {
      // 해당 날짜의 수업 목록이 로드된 후 수업 선택
      const courseExists = courses.some(c => c.id === pendingEdit.courseId);
      if (courseExists) {
        setSelectedCourseId(pendingEdit.courseId);
        setPendingEdit(null);
      }
    }
  }, [showListView, pendingEdit, courses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrolledStudents(selectedCourseId);
      fetchExistingLearningLog(selectedCourseId);
    } else {
      setEnrolledStudents([]);
      setExistingLog(null);
      setFormData({
        course_id: '',
        date: selectedDate,
        content: '',
        homework: '',
        notes: '',
        student_comments: {},
      });
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
      const coursesForDate = (data || []).filter((course: Course) => {
        if (course.schedule && Array.isArray(course.schedule) && course.schedule.length > 0) {
          // 새로운 schedule 필드 사용
          return course.schedule.some((s: { day_of_week: number }) => s.day_of_week === dayOfWeek);
        } else {
          // 기존 day_of_week 필드 사용 (하위 호환성)
          return (course as any).day_of_week === dayOfWeek;
        }
      });

      setCourses(coursesForDate);
      setSelectedCourseId(null); // 날짜 변경 시 선택된 수업 초기화
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
      alert('수업 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모든 학습일지 조회 (목록 보기용)
  const fetchAllLearningLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('learning_logs')
        .select(`
          *,
          courses:course_id (
            id,
            name,
            subject
          ),
          instructors:instructor_id (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map((log: any) => ({
        ...log,
        course_name: log.courses?.name || '-',
        course_subject: log.courses?.subject || '-',
        instructor_name: log.instructors?.name || '-',
      }));

      setAllLearningLogs(transformedData);
      setCurrentPage(1); // 목록 조회 시 첫 페이지로 리셋
    } catch (error) {
      console.error('학습일지 목록 조회 오류:', error);
      alert('학습일지 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수업에 등록된 학생 조회 (재학생만)
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
      
      // 재학생만 필터링
      const enrolledStudents = (data || [])
        .map((item: any) => item.students)
        .filter((student: any) => student && (student.status === 'active' || !student.status));
      
      setEnrolledStudents(enrolledStudents);

      // 학생별 코멘트 초기화
      const initialComments: Record<string, string> = {};
      enrolledStudents.forEach((student: Student) => {
        initialComments[student.id] = existingLog?.student_comments?.[student.id] || '';
      });
      setFormData(prev => ({
        ...prev,
        student_comments: initialComments,
      }));
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
    }
  };

  // 기존 학습일지 조회
  const fetchExistingLearningLog = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_logs')
        .select('*')
        .eq('course_id', courseId)
        .eq('date', selectedDate)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingLog(data);
        setFormData({
          course_id: courseId,
          date: selectedDate,
          content: data.content || '',
          homework: data.homework || '',
          notes: data.notes || '',
          student_comments: data.student_comments || {},
        });
      } else {
        setExistingLog(null);
        setFormData({
          course_id: courseId,
          date: selectedDate,
          content: '',
          homework: '',
          notes: '',
          student_comments: {},
        });
      }
    } catch (error) {
      console.error('기존 학습일지 조회 오류:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LearningLogFormData, string>> = {};

    if (!formData.course_id) {
      newErrors.course_id = '수업을 선택해주세요.';
    }
    if (!formData.content.trim()) {
      newErrors.content = '학습 내용을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (!selectedCourseId) {
      alert('수업을 선택해주세요.');
      return;
    }

    // 선택된 수업의 강사 ID 가져오기
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) {
      alert('수업을 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      // 빈 코멘트 제거
      const studentComments = Object.fromEntries(
        Object.entries(formData.student_comments || {}).filter(([_, comment]) => comment.trim())
      );

      if (existingLog) {
        // 기존 학습일지 수정
        const { error } = await supabase
          .from('learning_logs')
          .update({
            content: formData.content,
            homework: formData.homework || null,
            notes: formData.notes || null,
            student_comments: Object.keys(studentComments).length > 0 ? studentComments : null,
          })
          .eq('id', existingLog.id);

        if (error) throw error;
        alert('학습일지가 수정되었습니다.');
      } else {
        // 새 학습일지 작성
        const { error } = await supabase
          .from('learning_logs')
          .insert([{
            course_id: selectedCourseId,
            date: selectedDate,
            content: formData.content,
            homework: formData.homework || null,
            notes: formData.notes || null,
            instructor_id: selectedCourse.instructor_id,
            student_comments: Object.keys(studentComments).length > 0 ? studentComments : null,
          }]);

        if (error) {
          if (error.code === '23505') {
            alert('해당 날짜에 이미 학습일지가 등록되어 있습니다.');
          } else {
            throw error;
          }
          return;
        }
        alert('학습일지가 작성되었습니다.');
      }

      // 폼 초기화 및 수업 선택 해제
      setSelectedCourseId(null);
      fetchCoursesForDate();
      if (showListView) {
        fetchAllLearningLogs();
      }
    } catch (error: any) {
      console.error('학습일지 저장 오류:', error);
      alert('학습일지 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingLog) return;
    
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('learning_logs')
        .delete()
        .eq('id', existingLog.id);

      if (error) throw error;
      
      alert('학습일지가 삭제되었습니다.');
      setSelectedCourseId(null);
      fetchCoursesForDate();
      if (showListView) {
        fetchAllLearningLogs();
      }
    } catch (error) {
      console.error('학습일지 삭제 오류:', error);
      alert('학습일지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(allLearningLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = allLearningLogs.slice(startIndex, endIndex);

  // 텍스트 자르기 함수
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학습일지</h1>
        <div className="flex gap-2">
          <Button
            variant={showListView ? "outline" : "default"}
            onClick={() => {
              setShowListView(!showListView);
              setSelectedCourseId(null);
            }}
          >
            {showListView ? '작성하기' : '목록보기'}
          </Button>
        </div>
      </div>

      {!showListView ? (
        <>
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
                        ? course.schedule.find((s: { day_of_week: number }) => {
                            const date = new Date(selectedDate);
                            return s.day_of_week === date.getDay();
                          })
                        : null;
                      const timeDisplay = schedule
                        ? `${schedule.start_time} ~ ${schedule.end_time}`
                        : `${(course as any).start_time} ~ ${(course as any).end_time}`;

                      return (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourseId(course.id)}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
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

              {/* 학습일지 작성/수정 폼 */}
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
                        {existingLog && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            기존 학습일지 수정
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {existingLog && (
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                        >
                          삭제
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedCourseId(null)}
                      >
                        수업 선택으로 돌아가기
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        학습 내용 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className={`flex min-h-[120px] w-full rounded-md border ${errors.content ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                        placeholder="오늘 배운 내용을 작성해주세요."
                        required
                      />
                      {errors.content && (
                        <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        숙제
                      </label>
                      <textarea
                        value={formData.homework}
                        onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                        className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="숙제 내용을 작성해주세요."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        특이사항
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="특이사항이나 메모를 작성해주세요."
                      />
                    </div>

                    {enrolledStudents.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          학생별 개별 코멘트
                        </label>
                        <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                          {enrolledStudents.map((student) => (
                            <div key={student.id}>
                              <label className="block text-sm font-medium mb-1 text-gray-600">
                                {student.name}
                              </label>
                              <textarea
                                value={formData.student_comments?.[student.id] || ''}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    student_comments: {
                                      ...formData.student_comments,
                                      [student.id]: e.target.value,
                                    },
                                  });
                                }}
                                className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={`${student.name} 학생에 대한 개별 코멘트를 작성해주세요.`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? '저장 중...' : existingLog ? '수정' : '작성'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* 학습일지 목록 (카드 형식) */}
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : allLearningLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 학습일지가 없습니다.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{log.course_name}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {log.course_subject}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.date).toLocaleDateString('ko-KR')} | {log.instructor_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {truncateText(log.content || '', 100)}
                        </p>
                      </div>
                      {log.homework && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">숙제: </span>
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {truncateText(log.homework, 50)}
                          </span>
                        </div>
                      )}
                      {log.notes && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">특이사항: </span>
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {truncateText(log.notes, 50)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingEdit({ date: log.date, courseId: log.course_id });
                          setSelectedDate(log.date);
                          setShowListView(false);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('정말 삭제하시겠습니까?')) return;
                          try {
                            const { error } = await supabase
                              .from('learning_logs')
                              .delete()
                              .eq('id', log.id);
                            if (error) throw error;
                            alert('학습일지가 삭제되었습니다.');
                            fetchAllLearningLogs();
                          } catch (error) {
                            console.error('학습일지 삭제 오류:', error);
                            alert('학습일지 삭제 중 오류가 발생했습니다.');
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
