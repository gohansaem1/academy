'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Instructor } from '@/types/instructor';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('강사 목록 조회 오류:', error);
      alert('강사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchInstructors();
      alert('강사가 삭제되었습니다.');
    } catch (error: any) {
      console.error('강사 삭제 오류:', error);
      if (error.code === '23503') {
        alert('이 강사가 담당하는 수업이 있어 삭제할 수 없습니다.');
      } else {
        alert('강사 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.phone.includes(searchTerm) ||
    instructor.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">강사 관리</h1>
        <Link href="/instructors/new">
          <Button>강사 등록</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="이름, 전화번호 또는 과목으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredInstructors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 강사가 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>담당 과목</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.name}</TableCell>
                  <TableCell>{instructor.phone}</TableCell>
                  <TableCell>{instructor.email || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {instructor.subject}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(instructor.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/instructors/${instructor.id}`}>
                        <Button variant="outline" size="sm">상세</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(instructor.id)}
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

