'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import { AttendanceFormData } from '@/types/attendance';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function NewAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<AttendanceFormData>({
    course_id: '',
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AttendanceFormData, string>>>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (formData.course_id) {
      fetchEnrolledStudents(formData.course_id);
    } else {
      setStudents([]);
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
      const enrolledStudents = (data || []).map((item: any) => item.students).filter(Boolean);
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('등록 학생 조회 오류:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AttendanceFormData, string>> = {};

    if (!formData.course_id) {
      newErrors.course_id = '수업을 선택해주세요.';
    }
    if (!formData.student_id) {
      newErrors.student_id = '학생을 선택해주세요.';
    }
    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요.';
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
        .from('attendance')
        .insert([{
          course_id: formData.course_id,
          student_id: formData.student_id,
          date: formData.date,
          status: formData.status,
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('이미 등록된 출석 기록입니다.');
        } else {
          throw error;
        }
        return;
      }

      alert('출석이 기록되었습니다.');
      router.push('/attendance');
    } catch (error: any) {
      console.error('출석 기록 오류:', error);
      alert('출석 기록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">출석 체크</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            수업 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value, student_id: '' })}
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

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            학생 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            className={`flex h-10 w-full rounded-md border ${errors.student_id ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            disabled={!formData.course_id}
            required
          >
            <option value="">학생을 선택하세요</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.phone})
              </option>
            ))}
          </select>
          {errors.student_id && (
            <p className="mt-1 text-sm text-red-500">{errors.student_id}</p>
          )}
        </div>

        <Input
          label="날짜"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          error={errors.date}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            출석 상태 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            required
          >
            <option value="present">출석</option>
            <option value="late">지각</option>
            <option value="absent">결석</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? '기록 중...' : '기록'}
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

