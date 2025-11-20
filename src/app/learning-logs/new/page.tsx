'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import { Instructor } from '@/types/instructor';
import { LearningLogFormData } from '@/types/learning-log';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function NewLearningLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [formData, setFormData] = useState<LearningLogFormData>({
    course_id: courseIdParam || '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    homework: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LearningLogFormData, string>>>({});

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (formData.course_id) {
      const selectedCourse = courses.find(c => c.id === formData.course_id);
      if (selectedCourse) {
        // 선택된 수업의 강사 ID를 자동으로 설정할 수 있지만, 
        // 현재는 수동 선택으로 두겠습니다.
      }
    }
  }, [formData.course_id]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
    }
  };

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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LearningLogFormData, string>> = {};

    if (!formData.course_id) {
      newErrors.course_id = '수업을 선택해주세요.';
    }
    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요.';
    }
    if (!formData.content.trim()) {
      newErrors.content = '학습 내용을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // 선택된 수업의 강사 ID 가져오기
    const selectedCourse = courses.find(c => c.id === formData.course_id);
    if (!selectedCourse) {
      alert('수업을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('learning_logs')
        .insert([{
          course_id: formData.course_id,
          date: formData.date,
          content: formData.content,
          homework: formData.homework || null,
          notes: formData.notes || null,
          instructor_id: selectedCourse.instructor_id,
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('해당 날짜에 이미 학습일지가 등록되어 있습니다.');
        } else {
          throw error;
        }
        return;
      }

      alert('학습일지가 작성되었습니다.');
      router.push('/courses');
    } catch (error: any) {
      console.error('학습일지 작성 오류:', error);
      alert('학습일지 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">학습일지 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            수업 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className={`flex h-10 w-full rounded-md border ${errors.course_id ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            required
          >
            <option value="">수업을 선택하세요</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.subject})
              </option>
            ))}
          </select>
          {errors.course_id && (
            <p className="mt-1 text-sm text-red-500">{errors.course_id}</p>
          )}
        </div>

        <Input
          label="수업 날짜"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          error={errors.date}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            학습 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className={`flex min-h-[120px] w-full rounded-md border ${errors.content ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            placeholder="오늘 배운 내용을 작성해주세요."
            required
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            숙제
          </label>
          <textarea
            value={formData.homework}
            onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="숙제 내용을 작성해주세요."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            특이사항
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="특이사항이나 메모를 작성해주세요."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? '작성 중...' : '작성'}
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

