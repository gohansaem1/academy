'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course, CourseEnrollment } from '@/types/course';
import { LearningLog } from '@/types/learning-log';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9; // 한 페이지에 표시할 카드 수

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id as string);
      fetchEnrollments(params.id as string);
      fetchLearningLogs(params.id as string);
    }
  }, [params.id]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructors(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setCourse({
        ...data,
        instructor_name: (data as any).instructors?.name,
      });
    } catch (error) {
      console.error('수업 조회 오류:', error);
      alert('수업 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          students(name, status)
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      // 재학생만 필터링
      const enrollmentsWithNames = (data || [])
        .filter((enrollment: any) => 
          enrollment.students && 
          (enrollment.students.status === 'active' || !enrollment.students.status)
        )
        .map((enrollment: any) => ({
          ...enrollment,
          student_name: enrollment.students?.name,
        }));

      setEnrollments(enrollmentsWithNames);
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
    }
  };

  const fetchLearningLogs = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_logs')
        .select(`
          *,
          instructors(name)
        `)
        .eq('course_id', courseId)
        .order('date', { ascending: false });

      if (error) throw error;

      // 학생 정보도 함께 가져오기 (코멘트 표시용, 재학생만)
      const studentIds = enrollments.map(e => e.student_id);
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, status')
        .in('id', studentIds)
        .or('status.is.null,status.eq.active');

      const studentsMap = new Map((studentsData || []).map((s: any) => [s.id, s.name]));

      const logsWithNames = (data || []).map((log: any) => {
        // 학생이 자신의 학습일지를 볼 때는 자신의 코멘트만 표시
        let filteredComments = log.student_comments || {};
        if (user?.role === 'STUDENT') {
          // 학생이 수강하는 수업인지 확인
          const isEnrolled = enrollments.some(e => e.student_id === user.id);
          if (isEnrolled && log.student_comments) {
            // 현재 로그인한 학생의 코멘트만 필터링
            filteredComments = log.student_comments[user.id] 
              ? { [user.id]: log.student_comments[user.id] }
              : {};
          } else {
            filteredComments = {};
          }
        }

        return {
          ...log,
          instructor_name: log.instructors?.name,
          student_comments: filteredComments,
          studentsMap, // 학생 이름 매핑
        };
      });

      setLearningLogs(logsWithNames);
    } catch (error) {
      console.error('학습일지 조회 오류:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('learning_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      fetchLearningLogs(params.id as string);
      alert('학습일지가 삭제되었습니다.');
    } catch (error) {
      console.error('학습일지 삭제 오류:', error);
      alert('학습일지 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      alert('수업이 삭제되었습니다.');
      router.push('/courses');
    } catch (error: any) {
      console.error('수업 삭제 오류:', error);
      alert('수업 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUnenroll = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 수업에서 제외하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
      fetchEnrollments(params.id as string);
      alert('학생이 제외되었습니다.');
    } catch (error) {
      console.error('학생 제외 오류:', error);
      alert('학생 제외 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!course) {
    return <div className="text-center py-8">수업을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">수업 상세 정보</h1>
        <div className="flex gap-2">
          <Link href={`/courses/${params.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
          <Link href={`/courses/${params.id}/enroll`}>
            <Button>학생 등록</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-500">수업명</label>
          <p className="text-lg font-semibold mt-1">{course.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">과목</label>
            <p className="text-lg mt-1">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                {course.subject}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">강사</label>
            <p className="text-lg mt-1">{course.instructor_name || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">수업 일정</label>
            <div className="mt-1 space-y-1">
              {course.schedule && course.schedule.length > 0 ? (
                course.schedule.map((schedule, index) => (
                  <p key={index} className="text-lg">
                    {DAYS_OF_WEEK[schedule.day_of_week]} {schedule.start_time} ~ {schedule.end_time}
                  </p>
                ))
              ) : (
                <p className="text-lg">
                  {DAYS_OF_WEEK[course.day_of_week]} {course.start_time} ~ {course.end_time}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">정원</label>
            <p className="text-lg mt-1">
              {enrollments.length} / {course.capacity}명
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">수강료</label>
            <p className="text-lg mt-1">{course.tuition_fee.toLocaleString()}원</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">등록일</label>
          <p className="text-lg mt-1">
            {new Date(course.created_at).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">등록된 학생 ({enrollments.length}명)</h2>
        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">등록된 학생이 없습니다.</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.student_name || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.enrolled_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnenroll(enrollment.id, enrollment.student_name || '')}
                      >
                        제외
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">학습일지 ({learningLogs.length}개)</h2>
        </div>
        {learningLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            등록된 학습일지가 없습니다.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {learningLogs
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((log) => {
                  // 텍스트 자르기 함수
                  const truncateText = (text: string, maxLength: number) => {
                    if (!text) return '';
                    if (text.length <= maxLength) return text;
                    return text.substring(0, maxLength) + '...';
                  };

                  // 학생 코멘트 요약
                  let commentsSummary = '';
                  if (log.student_comments && Object.keys(log.student_comments).length > 0) {
                    const comments = Object.entries(log.student_comments)
                      .filter(([studentId]) => {
                        if (user?.role === 'STUDENT' && studentId !== user.id) {
                          return false;
                        }
                        return true;
                      })
                      .map(([studentId, comment]) => {
                        const studentName = (log as any).studentsMap?.get(studentId) || '학생';
                        return user?.role !== 'STUDENT' 
                          ? `${studentName}: ${comment}` 
                          : comment as string;
                      });
                    commentsSummary = comments.join('\n');
                  }

                  return (
                    <div key={log.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {new Date(log.date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            작성자: {log.instructor_name || '-'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/learning-logs/${log.id}/edit`}>
                            <Button variant="outline" size="sm">수정</Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">학습 내용</label>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {truncateText(log.content || '', 100)}
                            {commentsSummary && (
                              <>
                                {'\n\n'}
                                {truncateText(commentsSummary, 50)}
                              </>
                            )}
                          </p>
                        </div>
                        {log.homework && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">숙제</label>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {truncateText(log.homework, 60)}
                            </p>
                          </div>
                        )}
                        {log.notes && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">특이사항</label>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {truncateText(log.notes, 60)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 페이지네이션 */}
            {Math.ceil(learningLogs.length / ITEMS_PER_PAGE) > 1 && (
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
                  {currentPage} / {Math.ceil(learningLogs.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(learningLogs.length / ITEMS_PER_PAGE), prev + 1))}
                  disabled={currentPage === Math.ceil(learningLogs.length / ITEMS_PER_PAGE)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <Link href="/courses">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

