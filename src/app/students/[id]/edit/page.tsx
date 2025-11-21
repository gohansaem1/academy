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
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [lastClassDate, setLastClassDate] = useState<string>('');
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

      setCurrentStudent(data);
      setLastClassDate(data.last_class_date || '');
      setFormData({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        guardian_name: data.guardian_name,
        guardian_phone: data.guardian_phone,
        payment_due_day: data.payment_due_day || undefined,
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
      
      const oldFirstClassDate = currentStudent?.first_class_date || null;
      const newFirstClassDate = formData.first_class_date || null;
      
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        payment_due_day: formData.payment_due_day || null,
        first_class_date: newFirstClassDate,
      };
      
      // 상태는 자동으로 업데이트되므로 수동 변경 불가
      // 마지막 수업일은 별도 필드에서 수정 가능
      
      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      // 첫 수업일이 변경되었으면 결제 항목 업데이트
      if (oldFirstClassDate !== newFirstClassDate) {
        try {
          const { updatePaymentsForFirstClassDate } = await import('@/lib/utils/payment-cleanup');
          await updatePaymentsForFirstClassDate(
            params.id as string,
            newFirstClassDate,
            oldFirstClassDate
          );
          console.log('결제 항목 업데이트 완료');
        } catch (error) {
          console.error('결제 항목 업데이트 오류:', error);
          alert('학생 정보는 수정되었지만 결제 항목 업데이트 중 오류가 발생했습니다. 수강료 관리 페이지에서 확인해주세요.');
        }
      }

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
            마지막 수업일
          </label>
          <Input
            type="date"
            value={lastClassDate}
            onChange={(e) => {
              setLastClassDate(e.target.value);
            }}
            onBlur={async () => {
              const lastClassDateValue = lastClassDate || null;
              const previousLastClassDate = currentStudent?.last_class_date || null;
              
              try {
                // 마지막 수업일 업데이트 (상태는 자동으로 업데이트됨)
                const { error: updateError } = await supabase
                  .from('students')
                  .update({ last_class_date: lastClassDateValue })
                  .eq('id', params.id);
                
                if (updateError) throw updateError;
                
                // 자동 상태 업데이트 확인
                const { autoUpdateStudentStatusIfNeeded } = await import('@/lib/utils/student-status');
                const statusChanged = await autoUpdateStudentStatusIfNeeded(
                  params.id as string,
                  currentStudent?.status || 'active',
                  lastClassDateValue
                );
                
                // 마지막 수업일이 변경되었으면 환불 항목 재생성
                if (lastClassDateValue !== previousLastClassDate) {
                  try {
                    const { updateRefundsForLastClassDate } = await import('@/lib/utils/payment-cleanup');
                    await updateRefundsForLastClassDate(
                      params.id as string,
                      lastClassDateValue,
                      previousLastClassDate
                    );
                    console.log('환불 항목 업데이트 완료');
                  } catch (error) {
                    console.error('환불 항목 업데이트 오류:', error);
                    alert('마지막 수업일은 업데이트되었지만 환불 항목 업데이트 중 오류가 발생했습니다. 수강료 관리 페이지에서 확인해주세요.');
                  }
                }
                
                // 폼 데이터 새로고침
                fetchStudent(params.id as string);
              } catch (error) {
                console.error('마지막 수업일 업데이트 오류:', error);
                alert('마지막 수업일 업데이트 중 오류가 발생했습니다.');
                // 원래 값으로 복원
                setLastClassDate(currentStudent?.last_class_date || '');
              }
            }}
          />
          <p className="mt-1 text-sm text-gray-500">마지막 수업일을 입력하세요. 현재 날짜보다 이전이면 자동으로 그만둔 상태로 변경됩니다.</p>
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

