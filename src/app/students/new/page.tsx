'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { StudentFormData } from '@/types/student';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function NewStudentPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    payment_due_day: 25, // 기본값: 25일
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

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
      const { error } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          guardian_name: formData.guardian_name,
          guardian_phone: formData.guardian_phone,
          payment_due_day: formData.payment_due_day || null,
        }]);

      if (error) throw error;

      alert('학생이 등록되었습니다.');
      router.push('/students');
    } catch (error: any) {
      console.error('학생 등록 오류:', error);
      if (error.code === '23505') {
        alert('이미 등록된 전화번호입니다.');
      } else {
        alert('학생 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">학생 등록</h1>

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

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? '등록 중...' : '등록'}
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

