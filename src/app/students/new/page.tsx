'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { StudentFormData } from '@/types/student';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          guardian_name: formData.guardian_name,
          guardian_phone: formData.guardian_phone,
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
      setLoading(false);
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

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
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

