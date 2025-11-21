'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { StudentFormData } from '@/types/student';
import { Course } from '@/types/course';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { calculateProportionalTuition } from '@/lib/utils/tuition';

export default function NewStudentPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, number>>({}); // 수업별 등록 학생 수
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    payment_due_day: 25, // 기본값: 25일
    status: 'active', // 기본값: 재학
    first_class_date: new Date().toISOString().split('T')[0], // 기본값: 오늘
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

  useEffect(() => {
    if (!authLoading) {
      fetchCourses();
    }
  }, [authLoading]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);

      // 각 수업별 등록된 학생 수 조회 (재학생만)
      const enrollments: Record<string, number> = {};
      for (const course of data || []) {
        try {
          // 재학생만 카운트
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('students!inner(status)')
            .eq('course_id', course.id);
          
          if (!enrollmentError && enrollmentData) {
            const activeCount = enrollmentData.filter((item: any) => 
              item.students && (item.students.status === 'active' || !item.students.status)
            ).length;
            
            enrollments[course.id] = activeCount;
          } else {
            enrollments[course.id] = 0;
          }
        } catch (err) {
          console.error(`수업 ${course.id} 등록 학생 수 조회 오류:`, err);
          enrollments[course.id] = 0;
        }
      }
      setCourseEnrollments(enrollments);
    } catch (error) {
      console.error('수업 목록 조회 오류:', error);
      alert('수업 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingCourses(false);
    }
  };

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
    if (selectedCourses.length === 0) {
      newErrors.first_class_date = '최소 하나의 수업을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);

      // 학생 등록
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          guardian_name: formData.guardian_name,
          guardian_phone: formData.guardian_phone,
          payment_due_day: formData.payment_due_day || null,
          status: formData.status || 'active',
          first_class_date: formData.first_class_date || null,
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      const studentId = studentData.id;
      const firstClassDate = formData.first_class_date 
        ? new Date(formData.first_class_date) 
        : new Date();
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const dueDay = formData.payment_due_day || 25;

      // 선택한 수업에 등록 및 결제 항목 생성
      for (const courseId of selectedCourses) {
        const course = courses.find(c => c.id === courseId);
        if (!course) continue;

        // 정원 체크 (재학생만 카운트)
        const { data: enrollmentData, error: checkError } = await supabase
          .from('course_enrollments')
          .select('students!inner(status)')
          .eq('course_id', courseId);
        
        if (!checkError && enrollmentData) {
          const activeCount = enrollmentData.filter((item: any) => 
            item.students && (item.students.status === 'active' || !item.students.status)
          ).length;
          
          if (activeCount >= course.capacity) {
            alert(`${course.name} 수업의 정원이 초과되었습니다. (${activeCount}/${course.capacity}명)`);
            continue; // 다음 수업으로 넘어감
          }
        }

        // 수업 등록
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert([{
            course_id: courseId,
            student_id: studentId,
          }]);

        if (enrollError && enrollError.code !== '23505') {
          console.error('수업 등록 오류:', enrollError);
          continue;
        }

        // 결제일 계산
        let paymentDate = new Date(currentYear, currentMonth - 1, dueDay);
        if (paymentDate < today) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }

        // 첫달 결제 금액 계산: 첫달 남은일수 + 다음달 전액
        let firstPaymentAmount = course.tuition_fee * 2; // 기본값: 전액 * 2
        
        if (firstClassDate) {
          const firstMonthAmount = calculateProportionalTuition(
            course.tuition_fee,
            firstClassDate,
            currentYear,
            currentMonth
          );
          
          // 첫달 남은일수 + 다음달 전액
          firstPaymentAmount = firstMonthAmount + course.tuition_fee;
        }

        // 첫달 결제 항목 생성 (첫달 남은일수 + 다음달 전액)
        if (firstPaymentAmount > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert([{
              student_id: studentId,
              course_id: courseId,
              amount: firstPaymentAmount,
              payment_method: 'card', // 기본값: 카드
              payment_date: paymentDate.toISOString().split('T')[0],
              status: 'pending', // 기본값: 미납
              type: 'payment', // 수강료
            }]);

          if (paymentError) {
            console.error('결제 항목 생성 오류:', paymentError);
          }
        }
      }

      alert('학생이 등록되었습니다. 선택한 수업에 자동으로 등록되었고 결제 항목이 생성되었습니다.');
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

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            첫 수업일
          </label>
          <Input
            type="date"
            value={formData.first_class_date || ''}
            onChange={(e) => setFormData({ ...formData, first_class_date: e.target.value })}
            error={errors.first_class_date}
            required
          />
          <p className="mt-1 text-sm text-gray-500">학생의 첫 수업일을 입력하세요</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            학생 상태
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">재학</option>
            <option value="inactive">그만둔</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">학생의 현재 상태를 선택하세요</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            수업 선택 <span className="text-red-500">*</span>
          </label>
          {loadingCourses ? (
            <p className="text-sm text-gray-500">수업 목록을 불러오는 중...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-red-500">등록된 수업이 없습니다. 먼저 수업을 등록해주세요.</p>
          ) : (
            <div 
              className="space-y-2 border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto overscroll-contain"
              tabIndex={0}
              style={{ 
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc'
              }}
            >
              {courses.map((course) => {
                const enrolledCount = courseEnrollments[course.id] || 0;
                const isFull = enrolledCount >= course.capacity;
                const isSelected = selectedCourses.includes(course.id);
                
                return (
                  <label 
                    key={course.id} 
                    className={`flex items-center space-x-2 p-2 rounded ${
                      isFull && !isSelected 
                        ? 'cursor-not-allowed opacity-50 bg-gray-100' 
                        : 'cursor-pointer hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isFull && !isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // 정원 체크
                          if (isFull) {
                            alert(`${course.name} 수업의 정원이 초과되었습니다. (${enrolledCount}/${course.capacity}명)`);
                            return;
                          }
                          setSelectedCourses([...selectedCourses, course.id]);
                        } else {
                          setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="flex-1">
                      <span className={`font-medium ${isFull && !isSelected ? 'text-gray-400' : ''}`}>
                        {course.name}
                      </span>
                      <span className={`text-sm ml-2 ${isFull && !isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({course.subject} · {course.tuition_fee.toLocaleString()}원)
                      </span>
                      <span className={`text-xs ml-2 ${isFull ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        ({enrolledCount}/{course.capacity}명)
                        {isFull && !isSelected && ' [정원 초과]'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {selectedCourses.length === 0 && !loadingCourses && (
            <p className="mt-1 text-sm text-red-500">최소 하나의 수업을 선택해주세요.</p>
          )}
          <p className="mt-1 text-sm text-gray-500">학생이 수강할 수업을 선택하세요 (다중 선택 가능)</p>
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

