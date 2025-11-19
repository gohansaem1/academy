'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course, CourseEnrollment } from '@/types/course';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id as string);
      fetchEnrollments(params.id as string);
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
          students(name)
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const enrollmentsWithNames = (data || []).map((enrollment: any) => ({
        ...enrollment,
        student_name: enrollment.students?.name,
      }));

      setEnrollments(enrollmentsWithNames);
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
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
            <label className="text-sm font-medium text-gray-500">요일</label>
            <p className="text-lg mt-1">{DAYS_OF_WEEK[course.day_of_week]}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">시간</label>
            <p className="text-lg mt-1">
              {course.start_time} ~ {course.end_time}
            </p>
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

      <div className="mt-6">
        <Link href="/courses">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

