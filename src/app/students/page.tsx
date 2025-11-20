'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
      alert('학생 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStudents();
      alert('학생이 삭제되었습니다.');
    } catch (error) {
      console.error('학생 삭제 오류:', error);
      alert('학생 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학생 관리</h1>
        <Link href="/students/new">
          <Button>학생 등록</Button>
        </Link>
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
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>보호자 이름</TableHead>
                <TableHead>보호자 전화번호</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.guardian_name}</TableCell>
                  <TableCell>{student.guardian_phone}</TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/students/${student.id}`}>
                        <Button variant="outline" size="sm">상세</Button>
                      </Link>
                      <Link href={`/students/${student.id}?tab=attendance`}>
                        <Button variant="outline" size="sm">출석보기</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(student.id)}
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

