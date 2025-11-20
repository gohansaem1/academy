'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CourseFormData } from '@/types/course';
import { Instructor } from '@/types/instructor';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function NewCoursePage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    subject: '',
    instructor_id: '',
    day_of_week: 1,
    start_time: '',
    end_time: '',
    capacity: 20,
    tuition_fee: 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('강사 목록 조회 오류:', error);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchInstructors();
    }
  }, [authLoading]);
  
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
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '수업명을 입력해주세요.';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = '과목을 입력해주세요.';
    }
    if (!formData.instructor_id) {
      newErrors.instructor_id = '강사를 선택해주세요.';
    }
    if (!formData.start_time) {
      newErrors.start_time = '시작 시간을 입력해주세요.';
    }
    if (!formData.end_time) {
      newErrors.end_time = '종료 시간을 입력해주세요.';
    }
    if (formData.capacity <= 0) {
      newErrors.capacity = '정원은 1명 이상이어야 합니다.';
    }
    if (formData.tuition_fee < 0) {
      newErrors.tuition_fee = '수강료는 0원 이상이어야 합니다.';
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
        .from('courses')
        .insert([{
          name: formData.name,
          subject: formData.subject,
          instructor_id: formData.instructor_id,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          capacity: formData.capacity,
          tuition_fee: formData.tuition_fee,
        }]);

      if (error) throw error;

      alert('수업이 등록되었습니다.');
      router.push('/courses');
    } catch (error: any) {
      console.error('수업 등록 오류:', error);
      alert('수업 등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">수업 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="수업명"
          placeholder="예: 수학 기초반"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="과목"
          placeholder="예: 수학"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          error={errors.subject}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            강사 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.instructor_id}
            onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
            className={`flex h-10 w-full rounded-md border ${errors.instructor_id ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            required
          >
            <option value="">강사를 선택하세요</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name} ({instructor.subject})
              </option>
            ))}
          </select>
          {errors.instructor_id && (
            <p className="mt-1 text-sm text-red-500">{errors.instructor_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            요일 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            required
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <option key={index} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="시작 시간"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            error={errors.start_time}
            required
          />

          <Input
            label="종료 시간"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            error={errors.end_time}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="정원"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            error={errors.capacity}
            required
          />

          <Input
            label="수강료 (원)"
            type="number"
            min="0"
            value={formData.tuition_fee}
            onChange={(e) => setFormData({ ...formData, tuition_fee: parseInt(e.target.value) || 0 })}
            error={errors.tuition_fee}
            required
          />
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

