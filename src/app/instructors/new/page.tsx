'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { InstructorFormData } from '@/types/instructor';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function NewInstructorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InstructorFormData>({
    name: '',
    phone: '',
    email: '',
    subject: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InstructorFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InstructorFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = '담당 과목을 입력해주세요.';
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
        .from('instructors')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          subject: formData.subject,
        }]);

      if (error) throw error;

      alert('강사가 등록되었습니다.');
      router.push('/instructors');
    } catch (error: any) {
      console.error('강사 등록 오류:', error);
      if (error.code === '23505') {
        alert('이미 등록된 전화번호입니다.');
      } else {
        alert('강사 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">강사 등록</h1>

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
          placeholder="instructor@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        <Input
          label="담당 과목"
          placeholder="예: 수학, 영어, 과학"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          error={errors.subject}
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

