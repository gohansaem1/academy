'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructors(name),
          course_enrollments(count)
        `)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const coursesWithDetails = (data || []).map((course: any) => ({
        ...course,
        instructor_name: course.instructors?.name,
        enrolled_count: course.course_enrollments?.[0]?.count || 0,
      }));

      setCourses(coursesWithDetails);
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
      // 간단한 조회로 재시도
      const { data, error: simpleError } = await supabase
        .from('courses')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (!simpleError) {
        setCourses(data || []);
      } else {
        alert('수업 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCourses();
      alert('수업이 삭제되었습니다.');
    } catch (error: any) {
      console.error('수업 삭제 오류:', error);
      alert('수업 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">수업 관리</h1>
        <Link href="/courses/new">
          <Button>수업 등록</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="수업명, 과목 또는 강사명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 수업이 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수업명</TableHead>
                <TableHead>과목</TableHead>
                <TableHead>강사</TableHead>
                <TableHead>수업 일정</TableHead>
                <TableHead>요일 수</TableHead>
                <TableHead>정원</TableHead>
                <TableHead>수강료</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {course.subject}
                    </span>
                  </TableCell>
                  <TableCell>{course.instructor_name || '-'}</TableCell>
                  <TableCell>
                    {course.schedule && course.schedule.length > 0 ? (
                      <div className="space-y-1">
                        {course.schedule.map((s, idx) => (
                          <div key={idx} className="text-sm">
                            {DAYS_OF_WEEK[s.day_of_week]} {s.start_time}~{s.end_time}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {DAYS_OF_WEEK[course.day_of_week]} {course.start_time}~{course.end_time}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {course.schedule && course.schedule.length > 0 ? (
                      <div className="text-sm text-gray-500">
                        {course.schedule.length}개 요일
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {course.enrolled_count || 0} / {course.capacity}
                  </TableCell>
                  <TableCell>{course.tuition_fee.toLocaleString()}원</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm">상세</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                      >
                        삭제
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

