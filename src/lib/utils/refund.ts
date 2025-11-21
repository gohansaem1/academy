/**
 * 환불 생성 유틸리티 함수
 */

import { supabase } from '@/lib/supabase/client';
import { calculateRefundAmount } from './tuition';

/**
 * 학생이 inactive로 변경될 때 환불 생성
 * 전 달에 선결제한 부분을 마지막 수업일 기준으로 환불 계산
 * @param studentId 학생 ID
 * @param lastClassDate 마지막 수업일
 */
export async function createRefundForInactiveStudent(
  studentId: string,
  lastClassDate: string
): Promise<void> {
  try {
    // 학생이 수강 중인 모든 수업 조회
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        course_id,
        courses!inner(
          id,
          name,
          tuition_fee
        )
      `)
      .eq('student_id', studentId);

    if (enrollmentsError) {
      console.error('수업 등록 조회 오류:', enrollmentsError);
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      return; // 수강 중인 수업이 없으면 환불 없음
    }

    const lastDate = new Date(lastClassDate);
    const lastYear = lastDate.getFullYear();
    const lastMonth = lastDate.getMonth() + 1;

    // 학생 정보 조회 (first_class_date 확인 필요)
    const { data: studentInfo } = await supabase
      .from('students')
      .select('first_class_date, payment_due_day')
      .eq('id', studentId)
      .single();

    const firstClassDate = studentInfo?.first_class_date 
      ? new Date(studentInfo.first_class_date)
      : null;
    const firstYear = firstClassDate ? firstClassDate.getFullYear() : null;
    const firstMonth = firstClassDate ? firstClassDate.getMonth() + 1 : null;

    // 각 수업에 대해 환불 계산 및 생성
    for (const enrollment of enrollments) {
      const course = (enrollment as any).courses;
      if (!course || !course.tuition_fee) continue;

      let refundAmount = 0;

      // 첫 달과 마지막 달이 같은 경우
      if (firstClassDate && firstYear === lastYear && firstMonth === lastMonth) {
        // 첫 달 미수업 부분 환불
        const firstMonthRefund = calculateRefundAmount(
          course.tuition_fee,
          lastDate,
          lastYear,
          lastMonth
        );
        
        // 다음 달 전액 환불 (첫 달 결제에 포함되어 있었음)
        const nextMonth = lastMonth === 12 ? 1 : lastMonth + 1;
        const nextYear = lastMonth === 12 ? lastYear + 1 : lastYear;
        const nextMonthRefund = course.tuition_fee;
        
        refundAmount = firstMonthRefund + nextMonthRefund;
      } else {
        // 일반적인 경우: 마지막 수업일이 속한 달의 환불 금액만 계산
        refundAmount = calculateRefundAmount(
          course.tuition_fee,
          lastDate,
          lastYear,
          lastMonth
        );
      }

      if (refundAmount <= 0) continue; // 환불 금액이 없으면 스킵

      const dueDay = studentInfo?.payment_due_day || 25;

      // 환불일 계산 (마지막 수업일이 속한 달의 결제일)
      const refundDate = new Date(lastYear, lastMonth - 1, dueDay);
      const refundDateStr = refundDate.toISOString().split('T')[0];

      // 이미 환불이 생성되어 있는지 확인 (같은 달, 같은 수업)
      const refundMonthStart = new Date(lastYear, lastMonth - 1, 1);
      const refundMonthEnd = new Date(lastYear, lastMonth, 0);
      
      const { data: existingRefund } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', course.id)
        .eq('type', 'refund')
        .gte('payment_date', refundMonthStart.toISOString().split('T')[0])
        .lte('payment_date', refundMonthEnd.toISOString().split('T')[0])
        .maybeSingle();

      if (existingRefund) {
        continue; // 이미 환불이 있으면 스킵
      }

      // 환불 항목 생성 (음수 금액으로 저장)
      const { error: refundError } = await supabase
        .from('payments')
        .insert([{
          student_id: studentId,
          course_id: course.id,
          amount: -refundAmount, // 음수로 저장
          payment_method: 'card', // 기본값
          payment_date: refundDateStr, // 마지막 수업일이 속한 달의 결제일
          status: 'pending', // 기본값: 미지급
          type: 'refund',
        }]);

      if (refundError) {
        console.error(`환불 생성 오류 (수업: ${course.name}):`, refundError);
      }
    }
  } catch (error) {
    console.error('환불 생성 중 오류:', error);
  }
}

