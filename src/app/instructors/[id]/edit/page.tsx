'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { InstructorFormData } from '@/types/instructor';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function EditInstructorPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InstructorFormData>({
    name: '',
    phone: '',
    email: '',
    subject: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InstructorFormData, string>>>({});

  useEffect(() => {
    if (params.id) {
      fetchInstructor(params.id as string);
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

      setFormData({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        subject: data.subject,
      });
    } catch (error) {
      console.error('강사 조회 오류:', error);
      alert('강사 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/instructors');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      const { error } = await supabase
        .from('instructors')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          subject: formData.subject,
        })
        .eq('id', params.id);

      if (error) throw error;

      alert('강사 정보가 수정되었습니다.');
      router.push(`/instructors/${params.id}`);
    } catch (error: any) {
      console.error('강사 수정 오류:', error);
      if (error.code === '23505') {
        alert('이미 등록된 전화번호입니다.');
      } else {
        alert('강사 정보 수정 중 오류가 발생했습니다.');
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
      <h1 className="text-3xl font-bold mb-6">강사 정보 수정</h1>

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

