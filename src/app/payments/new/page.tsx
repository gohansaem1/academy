'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import { PaymentFormData } from '@/types/payment';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const PAYMENT_METHODS = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
};

export default function NewPaymentPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const router = useRouter();
  
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

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: '',
    course_id: '',
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (formData.course_id) {
      const selectedCourse = courses.find(c => c.id === formData.course_id);
      if (selectedCourse) {
        setFormData({ ...formData, amount: selectedCourse.tuition_fee });
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

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentFormData, string>> = {};

    if (!formData.student_id) {
      newErrors.student_id = '학생을 선택해주세요.';
    }
    if (!formData.course_id) {
      newErrors.course_id = '수업을 선택해주세요.';
    }
    if (formData.amount <= 0) {
      newErrors.amount = '결제 금액을 입력해주세요.';
    }
    if (!formData.payment_date) {
      newErrors.payment_date = '결제일을 선택해주세요.';
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
        .from('payments')
        .insert([{
          student_id: formData.student_id,
          course_id: formData.course_id,
          amount: formData.amount,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          status: formData.status || 'pending',
        }]);

      if (error) throw error;

      alert('결제가 등록되었습니다.');
      router.push('/payments');
    } catch (error: any) {
      console.error('결제 등록 오류:', error);
      alert('결제 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">결제 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            학생 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            className={`flex h-10 w-full rounded-md border ${errors.student_id ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
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
                {course.name} ({course.subject}) - {course.tuition_fee.toLocaleString()}원
              </option>
            ))}
          </select>
          {errors.course_id && (
            <p className="mt-1 text-sm text-red-500">{errors.course_id}</p>
          )}
        </div>

        <Input
          label="결제 금액 (원)"
          type="number"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
          error={errors.amount}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            결제 방법 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            required
          >
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="결제일"
          type="date"
          value={formData.payment_date}
          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          error={errors.payment_date}
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

