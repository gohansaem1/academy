'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import { CourseEnrollment } from '@/types/course';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';

export default function EnrollStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchEnrolledStudents();
  }, [params.id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
      alert('학생 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', params.id);

      if (error) throw error;
      setEnrolledStudents((data || []).map((e: any) => e.student_id));
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
    }
  };

  const handleEnroll = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: params.id,
          student_id: studentId,
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('이미 등록된 학생입니다.');
        } else {
          throw error;
        }
        return;
      }

      setEnrolledStudents([...enrolledStudents, studentId]);
      alert('학생이 등록되었습니다.');
    } catch (error: any) {
      console.error('학생 등록 오류:', error);
      alert('학생 등록 중 오류가 발생했습니다.');
    }
  };

  const filteredStudents = students.filter(student =>
    !enrolledStudents.includes(student.id) &&
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.phone.includes(searchTerm))
  );

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학생 등록</h1>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="이름 또는 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록 가능한 학생이 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(student.id)}
                    >
                      등록
                    </Button>
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

