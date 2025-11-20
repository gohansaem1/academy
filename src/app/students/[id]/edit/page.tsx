'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { StudentFormData } from '@/types/student';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

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

      setFormData({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        guardian_name: data.guardian_name,
        guardian_phone: data.guardian_phone,
        payment_due_day: data.payment_due_day || undefined,
        status: data.status || 'active',
        first_class_date: data.first_class_date || undefined,
      });
    } catch (error) {
      console.error('학생 조회 오류:', error);
      alert('학생 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/students');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if (!formData.guardian_name.trim()) {
      newErrors.guardian_name = '보호자 이름을 입력해주세요.';
    }
    if (!formData.guardian_phone.trim()) {
      newErrors.guardian_phone = '보호자 전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.guardian_phone)) {
      newErrors.guardian_phone = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if (formData.payment_due_day !== undefined && (formData.payment_due_day < 1 || formData.payment_due_day > 31)) {
      newErrors.payment_due_day = '결제일은 1일부터 31일 사이여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);
      
      // 현재 학생 정보 조회 (상태 변경 확인용)
      const { data: currentStudent } = await supabase
        .from('students')
        .select('status')
        .eq('id', params.id)
        .single();
      
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        payment_due_day: formData.payment_due_day || null,
        status: formData.status || 'active',
        first_class_date: formData.first_class_date || null,
      };
      
      // 그만둔 상태로 변경할 때 마지막 수업일자 기록
      const newStatus = formData.status || 'active';
      const oldStatus = currentStudent?.status || 'active';
      
      if (newStatus === 'inactive' && oldStatus !== 'inactive') {
        // 학생의 마지막 출석일 조회
        const { data: lastAttendance } = await supabase
          .from('attendance')
          .select('date')
          .eq('student_id', params.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();
        
        const lastClassDate = lastAttendance 
          ? lastAttendance.date 
          : new Date().toISOString().split('T')[0];
        
        updateData.last_class_date = lastClassDate;
        
        // 환불 계산 및 처리
        const { calculateRefundAmount } = await import('@/lib/utils/tuition');
        
        // 학생이 등록한 모든 수업 조회
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            course_id,
            courses(tuition_fee, schedule)
          `)
          .eq('student_id', params.id);
        
        if (!enrollmentsError && enrollments && enrollments.length > 0) {
          const today = new Date();
          const lastClassDateObj = new Date(lastClassDate);
          
          // 각 수업에 대해 환불 계산 (현재 달 + 이전 달)
          for (const enrollment of enrollments) {
            const course = enrollment.courses as any;
            if (!course) continue;
            
            const schedule = course.schedule 
              ? (typeof course.schedule === 'string' 
                  ? JSON.parse(course.schedule) 
                  : course.schedule)
              : [];
            
            if (schedule.length > 0) {
              // 현재 달 환불 계산
              const currentYear = today.getFullYear();
              const currentMonth = today.getMonth() + 1;
              const currentMonthRefund = calculateRefundAmount(
                course.tuition_fee,
                schedule,
                lastClassDateObj,
                currentYear,
                currentMonth
              );
              
              // 이전 달 환불 계산 (마지막 수업일이 이전 달에 있는 경우)
              let previousMonthRefund = 0;
              if (lastClassDateObj.getMonth() < today.getMonth() || 
                  (lastClassDateObj.getMonth() === today.getMonth() && lastClassDateObj.getFullYear() < today.getFullYear())) {
                const previousMonth = lastClassDateObj.getMonth() + 1;
                const previousYear = lastClassDateObj.getFullYear();
                previousMonthRefund = calculateRefundAmount(
                  course.tuition_fee,
                  schedule,
                  lastClassDateObj,
                  previousYear,
                  previousMonth
                );
              }
              
              // 환불 금액이 있으면 환불 결제 항목 생성
              if (currentMonthRefund > 0) {
                await supabase
                  .from('payments')
                  .insert([{
                    student_id: params.id,
                    course_id: enrollment.course_id,
                    amount: currentMonthRefund,
                    payment_method: 'transfer', // 환불은 계좌이체로
                    payment_date: today.toISOString().split('T')[0],
                    status: 'cancelled', // 환불은 취소 상태로 표시
                  }]);
              }
              
              if (previousMonthRefund > 0) {
                await supabase
                  .from('payments')
                  .insert([{
                    student_id: params.id,
                    course_id: enrollment.course_id,
                    amount: previousMonthRefund,
                    payment_method: 'transfer',
                    payment_date: today.toISOString().split('T')[0],
                    status: 'cancelled',
                  }]);
              }
            }
          }
        }
      } else if (newStatus === 'active' && oldStatus === 'inactive') {
        // 재학으로 변경할 때는 마지막 수업일자 초기화
        updateData.last_class_date = null;
      }
      
      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      alert('학생 정보가 수정되었습니다.');
      router.push(`/students/${params.id}`);
    } catch (error: any) {
      console.error('학생 수정 오류:', error);
      if (error.code === '23505') {
        alert('이미 등록된 전화번호입니다.');
      } else {
        alert('학생 정보 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">학생 정보 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이름"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="전화번호"
          placeholder="010-1234-5678"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          required
        />

        <Input
          label="이메일"
          type="email"
          placeholder="student@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        <Input
          label="주소"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          error={errors.address}
        />

        <Input
          label="보호자 이름"
          value={formData.guardian_name}
          onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
          error={errors.guardian_name}
          required
        />

        <Input
          label="보호자 전화번호"
          placeholder="010-1234-5678"
          value={formData.guardian_phone}
          onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
          error={errors.guardian_phone}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            매월 결제일
          </label>
          <Input
            type="number"
            min="1"
            max="31"
            placeholder="25"
            value={formData.payment_due_day || ''}
            onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value ? parseInt(e.target.value) : undefined })}
            error={errors.payment_due_day}
          />
          <p className="mt-1 text-sm text-gray-500">매월 결제일을 입력하세요 (1-31일)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            첫 수업일
          </label>
          <Input
            type="date"
            value={formData.first_class_date || ''}
            onChange={(e) => setFormData({ ...formData, first_class_date: e.target.value })}
            error={errors.first_class_date}
          />
          <p className="mt-1 text-sm text-gray-500">학생의 첫 수업일을 입력하세요</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            학생 상태
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">재학</option>
            <option value="inactive">그만둔</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">학생의 현재 상태를 선택하세요</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

