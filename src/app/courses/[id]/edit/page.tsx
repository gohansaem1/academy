'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CourseFormData, CourseSchedule } from '@/types/course';
import { Instructor } from '@/types/instructor';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [defaultStartTime, setDefaultStartTime] = useState('');
  const [defaultEndTime, setDefaultEndTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<number, { start_time: string; end_time: string }>>({});
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    subject: '',
    instructor_id: '',
    schedule: [],
    capacity: 20,
    tuition_fee: 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});

  useEffect(() => {
    fetchInstructors();
    if (params.id) {
      fetchCourse(params.id as string);
    }
  }, [params.id]);

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

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // schedule 필드가 있으면 사용, 없으면 기존 필드로 변환
      let schedule: CourseSchedule[] = [];
      if (data.schedule && Array.isArray(data.schedule)) {
        schedule = data.schedule;
      } else {
        // 기존 데이터 마이그레이션
        schedule = [{
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
        }];
      }

      // 기본 시간 설정 (첫 번째 스케줄의 시간)
      const firstSchedule = schedule[0];
      setDefaultStartTime(firstSchedule.start_time);
      setDefaultEndTime(firstSchedule.end_time);

      // 선택된 요일 설정
      const days = schedule.map(s => s.day_of_week);
      setSelectedDays(days);

      // 시간 오버라이드 설정 (기본 시간과 다른 경우)
      const overrides: Record<number, { start_time: string; end_time: string }> = {};
      schedule.forEach(s => {
        if (s.start_time !== firstSchedule.start_time || s.end_time !== firstSchedule.end_time) {
          overrides[s.day_of_week] = {
            start_time: s.start_time,
            end_time: s.end_time,
          };
        }
      });
      setScheduleOverrides(overrides);

      setFormData({
        name: data.name,
        subject: data.subject,
        instructor_id: data.instructor_id,
        schedule: schedule,
        capacity: data.capacity,
        tuition_fee: data.tuition_fee,
      });
    } catch (error) {
      console.error('수업 조회 오류:', error);
      alert('수업 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
      const newOverrides = { ...scheduleOverrides };
      delete newOverrides[dayIndex];
      setScheduleOverrides(newOverrides);
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleScheduleOverride = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setScheduleOverrides({
      ...scheduleOverrides,
      [dayIndex]: {
        ...scheduleOverrides[dayIndex],
        [field]: value,
      },
    });
  };

  const buildSchedule = (): CourseSchedule[] => {
    return selectedDays.map(dayIndex => ({
      day_of_week: dayIndex,
      start_time: scheduleOverrides[dayIndex]?.start_time || defaultStartTime,
      end_time: scheduleOverrides[dayIndex]?.end_time || defaultEndTime,
    }));
  };

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
    if (selectedDays.length === 0) {
      newErrors.schedule = '최소 하나의 요일을 선택해주세요.';
    }
    if (!defaultStartTime) {
      newErrors.schedule = '기본 시작 시간을 입력해주세요.';
    }
    if (!defaultEndTime) {
      newErrors.schedule = '기본 종료 시간을 입력해주세요.';
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

    const schedule = buildSchedule();
    if (schedule.length === 0) {
      alert('최소 하나의 요일을 선택해주세요.');
      return;
    }

    if (!validate()) return;

    try {
      setSaving(true);
      
      // 하위 호환성을 위해 첫 번째 스케줄을 기본값으로 사용
      const firstSchedule = schedule[0];
      
      const { error } = await supabase
        .from('courses')
        .update({
          name: formData.name,
          subject: formData.subject,
          instructor_id: formData.instructor_id,
          day_of_week: firstSchedule.day_of_week, // 하위 호환성
          start_time: firstSchedule.start_time, // 하위 호환성
          end_time: firstSchedule.end_time, // 하위 호환성
          schedule: schedule, // 새로운 스케줄 필드
          capacity: formData.capacity,
          tuition_fee: formData.tuition_fee,
        })
        .eq('id', params.id);

      if (error) throw error;

      alert('수업 정보가 수정되었습니다.');
      router.push(`/courses/${params.id}`);
    } catch (error: any) {
      console.error('수업 수정 오류:', error);
      alert('수업 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">수업 정보 수정</h1>

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

        {/* 기본 시간 설정 */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">기본 시간 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="기본 시작 시간"
              type="time"
              value={defaultStartTime}
              onChange={(e) => setDefaultStartTime(e.target.value)}
              required
            />
            <Input
              label="기본 종료 시간"
              type="time"
              value={defaultEndTime}
              onChange={(e) => setDefaultEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 요일 선택 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            수업 요일 선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDayToggle(index)}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  selectedDays.includes(index)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.schedule && (
            <p className="mt-1 text-sm text-red-500">{errors.schedule}</p>
          )}
        </div>

        {/* 선택된 요일별 시간 설정 */}
        {selectedDays.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              요일별 시간 설정 (선택사항 - 기본 시간과 다를 경우만 설정)
            </label>
            {selectedDays.map(dayIndex => {
              const override = scheduleOverrides[dayIndex];
              const showOverride = override?.start_time || override?.end_time;
              
              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{DAYS_OF_WEEK[dayIndex]}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (showOverride) {
                          const newOverrides = { ...scheduleOverrides };
                          delete newOverrides[dayIndex];
                          setScheduleOverrides(newOverrides);
                        } else {
                          setScheduleOverrides({
                            ...scheduleOverrides,
                            [dayIndex]: {
                              start_time: defaultStartTime,
                              end_time: defaultEndTime,
                            },
                          });
                        }
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {showOverride ? '기본 시간 사용' : '시간 변경'}
                    </button>
                  </div>
                  {showOverride ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="시작 시간"
                        type="time"
                        value={override?.start_time || defaultStartTime}
                        onChange={(e) => handleScheduleOverride(dayIndex, 'start_time', e.target.value)}
                      />
                      <Input
                        label="종료 시간"
                        type="time"
                        value={override?.end_time || defaultEndTime}
                        onChange={(e) => handleScheduleOverride(dayIndex, 'end_time', e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      기본 시간 사용: {defaultStartTime || '-'} ~ {defaultEndTime || '-'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

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

