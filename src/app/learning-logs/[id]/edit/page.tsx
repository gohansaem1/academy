'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LearningLogFormData } from '@/types/learning-log';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function EditLearningLogPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<LearningLogFormData>({
    course_id: '',
    date: '',
    content: '',
    homework: '',
    notes: '',
    student_comments: {},
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LearningLogFormData, string>>>({});

  useEffect(() => {
    fetchCourses();
    if (params.id) {
      fetchLearningLog(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (formData.course_id) {
      fetchEnrolledStudents(formData.course_id);
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

  const fetchLearningLog = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('learning_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        course_id: data.course_id,
        date: data.date,
        content: data.content,
        homework: data.homework || '',
        notes: data.notes || '',
        student_comments: data.student_comments || {},
      });
    } catch (error) {
      console.error('학습일지 조회 오류:', error);
      alert('학습일지 정보를 불러오는 중 오류가 발생했습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          students(*)
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      const students = (data || []).map((enrollment: any) => enrollment.students).filter(Boolean);
      setEnrolledStudents(students);

      // 기존 코멘트와 함께 학생 목록 업데이트
      const currentComments = formData.student_comments || {};
      const updatedComments: Record<string, string> = {};
      students.forEach((student: Student) => {
        updatedComments[student.id] = currentComments[student.id] || '';
      });
      setFormData(prev => ({
        ...prev,
        student_comments: updatedComments,
      }));
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
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

    try {
      setSaving(true);
      // 빈 코멘트 제거
      const studentComments = Object.fromEntries(
        Object.entries(formData.student_comments || {}).filter(([_, comment]) => comment.trim())
      );

      const { error } = await supabase
        .from('learning_logs')
        .update({
          course_id: formData.course_id,
          date: formData.date,
          content: formData.content,
          homework: formData.homework || null,
          notes: formData.notes || null,
          student_comments: Object.keys(studentComments).length > 0 ? studentComments : null,
        })
        .eq('id', params.id);

      if (error) throw error;

      alert('학습일지가 수정되었습니다.');
      router.push('/learning-logs');
    } catch (error: any) {
      console.error('학습일지 수정 오류:', error);
      if (error.code === '23505') {
        alert('해당 날짜에 이미 다른 학습일지가 등록되어 있습니다.');
      } else {
        alert('학습일지 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">학습일지 수정</h1>

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
            disabled
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

        {enrolledStudents.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              학생별 개별 코멘트
            </label>
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              {enrolledStudents.map((student) => (
                <div key={student.id}>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    {student.name}
                  </label>
                  <textarea
                    value={formData.student_comments?.[student.id] || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        student_comments: {
                          ...formData.student_comments,
                          [student.id]: e.target.value,
                        },
                      });
                    }}
                    className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={`${student.name} 학생에 대한 개별 코멘트를 작성해주세요.`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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

