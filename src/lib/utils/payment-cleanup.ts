/**
 * 결제 데이터 정리 유틸리티 함수
 */

import { supabase } from '@/lib/supabase/client';
import { calculateProportionalTuition, calculateRefundAmount } from './tuition';

/**
 * 첫 수업일 변경 시 결제 항목 재생성
 * 첫 수업일 이전의 결제 항목을 삭제하고 새로운 첫 수업일 기준으로 재생성
 * @param studentId 학생 ID
 * @param newFirstClassDate 새로운 첫 수업일
 * @param oldFirstClassDate 이전 첫 수업일 (없으면 null)
 */
export async function updatePaymentsForFirstClassDate(
  studentId: string,
  newFirstClassDate: string | null,
  oldFirstClassDate: string | null
): Promise<void> {
  try {
    if (!newFirstClassDate) {
      // 첫 수업일이 삭제되면 첫 수업일 이전의 모든 결제 항목 삭제
      // 학생이 수강 중인 모든 수업 조회
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        
        // 첫 수업일이 없는 경우, 등록일 이전의 결제 항목 삭제
        const { data: studentData } = await supabase
          .from('students')
          .select('created_at')
          .eq('id', studentId)
          .single();

        if (studentData) {
          const enrollmentDate = new Date(studentData.created_at);
          enrollmentDate.setHours(0, 0, 0, 0);
          
          // 등록일 이전의 결제 항목 삭제
          await supabase
            .from('payments')
            .delete()
            .eq('student_id', studentId)
            .in('course_id', courseIds)
            .eq('type', 'payment')
            .lt('payment_date', enrollmentDate.toISOString().split('T')[0]);
        }
      }
      return;
    }

    const newFirstDate = new Date(newFirstClassDate);
    newFirstDate.setHours(0, 0, 0, 0);

    // 학생이 수강 중인 모든 수업 조회
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        course_id,
        courses!inner(
          id,
          tuition_fee
        )
      `)
      .eq('student_id', studentId);

    if (enrollmentsError) {
      console.error('수업 등록 조회 오류:', enrollmentsError);
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      return; // 수강 중인 수업이 없으면 처리할 필요 없음
    }

    // 학생 정보 조회 (payment_due_day 필요)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('payment_due_day')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('학생 정보 조회 오류:', studentError);
      return;
    }

    const dueDay = studentData.payment_due_day || 25;

    // 각 수업에 대해 처리
    for (const enrollment of enrollments) {
      const course = (enrollment as any).courses;
      if (!course || !course.tuition_fee) continue;

      const courseId = enrollment.course_id;

      // 새로운 첫 수업일 이전의 결제 항목 삭제
      await supabase
        .from('payments')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('type', 'payment')
        .lt('payment_date', newFirstDate.toISOString().split('T')[0]);

      // 새로운 첫 수업일이 속한 달의 결제 항목이 있는지 확인
      const firstYear = newFirstDate.getFullYear();
      const firstMonth = newFirstDate.getMonth() + 1;
      const firstMonthStart = new Date(firstYear, firstMonth - 1, 1);
      const firstMonthEnd = new Date(firstYear, firstMonth, 0);

      // 해당 달의 결제 항목 조회
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('type', 'payment')
        .gte('payment_date', firstMonthStart.toISOString().split('T')[0])
        .lte('payment_date', firstMonthEnd.toISOString().split('T')[0]);

      // 해당 달의 결제 항목이 없으면 생성
      if (!existingPayments || existingPayments.length === 0) {
        const proportionalAmount = calculateProportionalTuition(
          course.tuition_fee,
          newFirstDate,
          firstYear,
          firstMonth
        );

        if (proportionalAmount > 0) {
          const paymentDate = new Date(firstYear, firstMonth - 1, dueDay);
          
          await supabase
            .from('payments')
            .insert([{
              student_id: studentId,
              course_id: courseId,
              amount: proportionalAmount,
              payment_method: 'card',
              payment_date: paymentDate.toISOString().split('T')[0],
              status: 'pending',
              type: 'payment',
            }]);
        }
      } else {
        // 기존 결제 항목이 있으면 금액만 업데이트
        const proportionalAmount = calculateProportionalTuition(
          course.tuition_fee,
          newFirstDate,
          firstYear,
          firstMonth
        );

        if (proportionalAmount > 0) {
          await supabase
            .from('payments')
            .update({ amount: proportionalAmount })
            .eq('id', existingPayments[0].id);
        }
      }

      // 다음 달 결제 항목이 있는지 확인하고 없으면 생성
      const nextMonth = firstMonth === 12 ? 1 : firstMonth + 1;
      const nextYear = firstMonth === 12 ? firstYear + 1 : firstYear;
      const nextMonthStart = new Date(nextYear, nextMonth - 1, 1);
      const nextMonthEnd = new Date(nextYear, nextMonth, 0);

      const { data: nextMonthPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('type', 'payment')
        .gte('payment_date', nextMonthStart.toISOString().split('T')[0])
        .lte('payment_date', nextMonthEnd.toISOString().split('T')[0]);

      if (!nextMonthPayments || nextMonthPayments.length === 0) {
        const nextMonthPaymentDate = new Date(nextYear, nextMonth - 1, dueDay);
        
        await supabase
          .from('payments')
          .insert([{
            student_id: studentId,
            course_id: courseId,
            amount: course.tuition_fee,
            payment_method: 'card',
            payment_date: nextMonthPaymentDate.toISOString().split('T')[0],
            status: 'pending',
            type: 'payment',
          }]);
      }
    }
  } catch (error) {
    console.error('첫 수업일 변경 시 결제 항목 업데이트 오류:', error);
  }
}

/**
 * 마지막 수업일 변경 시 환불 항목 재생성
 * 기존 환불 항목을 삭제하고 새로운 마지막 수업일 기준으로 재생성
 * @param studentId 학생 ID
 * @param newLastClassDate 새로운 마지막 수업일
 * @param oldLastClassDate 이전 마지막 수업일 (없으면 null)
 */
export async function updateRefundsForLastClassDate(
  studentId: string,
  newLastClassDate: string | null,
  oldLastClassDate: string | null
): Promise<void> {
  try {
    // 기존 환불 항목 삭제
    await supabase
      .from('payments')
      .delete()
      .eq('student_id', studentId)
      .eq('type', 'refund');

    // 새로운 마지막 수업일이 있으면 환불 생성
    if (newLastClassDate) {
      const { createRefundForInactiveStudent } = await import('./refund');
      await createRefundForInactiveStudent(studentId, newLastClassDate);
    }
  } catch (error) {
    console.error('마지막 수업일 변경 시 환불 항목 업데이트 오류:', error);
  }
}

