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
        .or('status.is.null,status.eq.active') // 재학생만 조회
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
      // 수업 정보 조회 (스케줄 포함)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('tuition_fee, schedule')
        .eq('id', params.id)
        .single();

      if (courseError) throw courseError;

      // 학생 정보 조회 (결제일, 첫 수업일 확인)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('payment_due_day, first_class_date')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // 수업 등록
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: params.id,
          student_id: studentId,
        }]);

      if (enrollError) {
        if (enrollError.code === '23505') {
          alert('이미 등록된 학생입니다.');
        } else {
          throw enrollError;
        }
        return;
      }

      // 첫 수업일 기준으로 해당 달 남은 수업 금액 계산
      const today = new Date();
      const firstClassDate = studentData.first_class_date 
        ? new Date(studentData.first_class_date) 
        : today;
      
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
      // 결제일 계산 (학생의 payment_due_day 사용, 없으면 현재 달의 25일)
      const dueDay = studentData.payment_due_day || 25;
      let paymentDate = new Date(currentYear, currentMonth - 1, dueDay);
      
      // 결제일이 이미 지났으면 다음 달로 설정
      if (paymentDate < today) {
        paymentDate.setMonth(paymentDate.getMonth() + 1);
      }

      // 첫달 결제 금액 계산: 첫달 남은일수 + 다음달 전액
      let firstPaymentAmount = courseData.tuition_fee * 2; // 기본값: 전액 * 2
      
      if (firstClassDate) {
        const { calculateProportionalTuition } = await import('@/lib/utils/tuition');
        const firstMonthAmount = calculateProportionalTuition(
          courseData.tuition_fee,
          firstClassDate,
          currentYear,
          currentMonth
        );
        
        // 첫달 남은일수 + 다음달 전액
        firstPaymentAmount = firstMonthAmount + courseData.tuition_fee;
      }

      // 첫달 결제 항목 생성 (첫달 남은일수 + 다음달 전액)
      if (firstPaymentAmount > 0) {
        const { error: firstPaymentError } = await supabase
          .from('payments')
          .insert([{
            student_id: studentId,
            course_id: params.id as string,
            amount: firstPaymentAmount,
            payment_method: 'card', // 기본값: 카드
            payment_date: paymentDate.toISOString().split('T')[0],
            status: 'pending', // 기본값: 미납
            type: 'payment', // 수강료
          }]);

        if (firstPaymentError) {
          console.error('첫달 결제 항목 생성 오류:', firstPaymentError);
        }
      }

      setEnrolledStudents([...enrolledStudents, studentId]);
      alert('학생이 등록되었습니다. 결제 항목이 자동으로 생성되었습니다.');
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

