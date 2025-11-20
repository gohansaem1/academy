'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LearningLog } from '@/types/learning-log';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

export default function LearningLogsPage() {
  const { user, loading: authLoading } = useAuth('TEACHER');
  const router = useRouter();
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      fetchLearningLogs();
    }
  }, [authLoading]);

  const fetchLearningLogs = async () => {
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

      // 데이터 변환
      const transformedData = (data || []).map((log: any) => {
        // 학습 내용에 학생 코멘트 포함
        let fullContent = log.content || '';
        if (log.student_comments && Object.keys(log.student_comments).length > 0) {
          const comments = Object.entries(log.student_comments)
            .map(([_, comment]) => comment as string)
            .join('\n\n');
          fullContent = fullContent + '\n\n' + comments;
        }

        return {
          ...log,
          course_name: log.courses?.name || '-',
          instructor_name: log.instructors?.name || '-',
          fullContent, // 전체 내용 (코멘트 포함)
        };
      });

      setLearningLogs(transformedData);
    } catch (error) {
      console.error('학습일지 목록 조회 오류:', error);
      alert('학습일지 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('learning_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLearningLogs();
      alert('학습일지가 삭제되었습니다.');
    } catch (error) {
      console.error('학습일지 삭제 오류:', error);
      alert('학습일지 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredLogs = learningLogs.filter(log => {
    const fullContent = (log as any).fullContent || log.content || '';
    return (
      log.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학습일지</h1>
        <Link href="/learning-logs/new">
          <Button>작성하기</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="수업명, 내용, 강사명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 학습일지가 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수업명</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>강사명</TableHead>
                <TableHead>학습 내용</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.course_name}</TableCell>
                  <TableCell>
                    {new Date(log.date).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>{log.instructor_name}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={(log as any).fullContent || log.content}>
                      {(log as any).fullContent || log.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/learning-logs/${log.id}/edit`}>
                        <Button variant="outline" size="sm">수정</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(log.id)}
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

