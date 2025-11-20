'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import { LearningLog } from '@/types/learning-log';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchStudent(params.id as string);
      fetchLearningLogs(params.id as string);
    }
  }, [params.id]);

  const fetchStudent = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);
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
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // 해당 수업들의 학습일지 조회
      const { data, error } = await supabase
        .from('learning_logs')
        .select(`
          *,
          courses(name, subject),
          instructors(name)
        `)
        .in('course_id', courseIds)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;

      const logsWithNames = (data || []).map((log: any) => ({
        ...log,
        course_name: log.courses?.name,
        instructor_name: log.instructors?.name,
      }));

      setLearningLogs(logsWithNames);
    } catch (error) {
      console.error('학습일지 조회 오류:', error);
    } finally {
      setLogsLoading(false);
    }
  };

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

  return (
    <div className="max-w-2xl">
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

      <div className="bg-white border rounded-lg p-6 space-y-4">
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

      <div className="mt-8">
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
                    <p className="text-sm mt-1 whitespace-pre-wrap">{log.content}</p>
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

      <div className="mt-6">
        <Link href="/students">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

