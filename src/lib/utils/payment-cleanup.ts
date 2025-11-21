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

      // 새로운 첫 수업일이 속한 달의 시작일 계산
      const firstYear = newFirstDate.getFullYear();
      const firstMonth = newFirstDate.getMonth() + 1;
      const firstMonthStart = new Date(firstYear, firstMonth - 1, 1);
      const firstMonthStartStr = firstMonthStart.toISOString().split('T')[0];
      const firstMonthEnd = new Date(firstYear, firstMonth, 0);

      // 새로운 첫 수업일 이전 달의 모든 결제 항목 삭제
      // (첫 수업일이 속한 달의 결제 항목은 삭제하지 않고 업데이트)
      await supabase
        .from('payments')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('type', 'payment')
        .lt('payment_date', firstMonthStartStr);

      // 새로운 첫 수업일이 속한 달의 결제 항목이 있는지 확인

      // 해당 달의 결제 항목 조회
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('type', 'payment')
        .gte('payment_date', firstMonthStartStr)
        .lte('payment_date', firstMonthEnd.toISOString().split('T')[0]);

      // 비례 계산된 금액 계산
      const proportionalAmount = calculateProportionalTuition(
        course.tuition_fee,
        newFirstDate,
        firstYear,
        firstMonth
      );

      if (proportionalAmount > 0) {
        const paymentDate = new Date(firstYear, firstMonth - 1, dueDay);
        const paymentDateStr = paymentDate.toISOString().split('T')[0];

        // 해당 달의 결제 항목이 없으면 생성
        if (!existingPayments || existingPayments.length === 0) {
          const { error: insertError } = await supabase
            .from('payments')
            .insert([{
              student_id: studentId,
              course_id: courseId,
              amount: proportionalAmount,
              payment_method: 'card',
              payment_date: paymentDateStr,
              status: 'pending',
              type: 'payment',
            }]);

          if (insertError) {
            console.error('첫 달 결제 항목 생성 오류:', insertError);
          }
        } else {
          // 기존 결제 항목이 있으면 금액과 결제일 업데이트
          const { error: updateError } = await supabase
            .from('payments')
            .update({ 
              amount: proportionalAmount,
              payment_date: paymentDateStr
            })
            .eq('id', existingPayments[0].id);

          if (updateError) {
            console.error('첫 달 결제 항목 업데이트 오류:', updateError);
          }
        }
      } else {
        // 비례 계산 금액이 0이면 해당 달 결제 항목 삭제
        if (existingPayments && existingPayments.length > 0) {
          await supabase
            .from('payments')
            .delete()
            .eq('id', existingPayments[0].id);
        }
      }

      // 첫 수업일 이후의 모든 결제 항목 재생성
      // 현재 날짜부터 12개월 후까지의 결제 항목 생성
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 12);

      let currentDate = new Date(firstMonthStart);
      currentDate.setMonth(currentDate.getMonth() + 1); // 첫 달 다음 달부터 시작

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        // 해당 달의 결제 항목 조회
        const { data: monthPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .eq('type', 'payment')
          .gte('payment_date', monthStartStr)
          .lte('payment_date', monthEndStr);

        if (!monthPayments || monthPayments.length === 0) {
          // 결제 항목이 없으면 생성
          const paymentDate = new Date(year, month - 1, dueDay);
          const paymentDateStr = paymentDate.toISOString().split('T')[0];

          const { error: insertError } = await supabase
            .from('payments')
            .insert([{
              student_id: studentId,
              course_id: courseId,
              amount: course.tuition_fee, // 첫 달 이후는 전액
              payment_method: 'card',
              payment_date: paymentDateStr,
              status: 'pending',
              type: 'payment',
            }]);

          if (insertError) {
            console.error(`${year}년 ${month}월 결제 항목 생성 오류:`, insertError);
          }
        }

        // 다음 달로 이동
        currentDate.setMonth(currentDate.getMonth() + 1);
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

