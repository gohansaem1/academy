'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Instructor } from '@/types/instructor';
import Button from '@/components/common/Button';

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchInstructor(params.id as string);
      fetchCourseCount(params.id as string);
    }
  }, [params.id]);

  const fetchInstructor = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInstructor(data);
    } catch (error) {
      console.error('강사 조회 오류:', error);
      alert('강사 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/instructors');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCount = async (instructorId: string) => {
    try {
      const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId);

      if (error) throw error;
      setCourseCount(count || 0);
    } catch (error) {
      console.error('수업 수 조회 오류:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      alert('강사가 삭제되었습니다.');
      router.push('/instructors');
    } catch (error: any) {
      console.error('강사 삭제 오류:', error);
      if (error.code === '23503') {
        alert('이 강사가 담당하는 수업이 있어 삭제할 수 없습니다.');
      } else {
        alert('강사 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!instructor) {
    return <div className="text-center py-8">강사를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">강사 상세 정보</h1>
        <div className="flex gap-2">
          <Link href={`/instructors/${params.id}/edit`}>
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
          <p className="text-lg font-semibold mt-1">{instructor.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">전화번호</label>
          <p className="text-lg mt-1">{instructor.phone}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">이메일</label>
          <p className="text-lg mt-1">{instructor.email || '-'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">담당 과목</label>
          <p className="text-lg mt-1">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
              {instructor.subject}
            </span>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">담당 수업 수</label>
          <p className="text-lg mt-1">{courseCount}개</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">등록일</label>
          <p className="text-lg mt-1">
            {new Date(instructor.created_at).toLocaleString('ko-KR')}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">수정일</label>
          <p className="text-lg mt-1">
            {new Date(instructor.updated_at).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/instructors">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}

