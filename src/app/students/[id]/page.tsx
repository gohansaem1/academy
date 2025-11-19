'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import Button from '@/components/common/Button';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStudent(params.id as string);
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

      <div className="mt-6">
        <Link href="/students">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

