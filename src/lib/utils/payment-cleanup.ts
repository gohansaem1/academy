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

      // 첫달 결제 금액 계산: 첫달 남은일수 + 다음달 전액
      const proportionalAmount = calculateProportionalTuition(
        course.tuition_fee,
        newFirstDate,
        firstYear,
        firstMonth
      );

      // 첫달 남은일수 + 다음달 전액
      const firstPaymentAmount = proportionalAmount + course.tuition_fee;

      if (firstPaymentAmount > 0) {
        const paymentDate = new Date(firstYear, firstMonth - 1, dueDay);
        const paymentDateStr = paymentDate.toISOString().split('T')[0];

        // 해당 달의 결제 항목이 없으면 생성
        if (!existingPayments || existingPayments.length === 0) {
          const { error: insertError } = await supabase
            .from('payments')
            .insert([{
              student_id: studentId,
              course_id: courseId,
              amount: firstPaymentAmount, // 첫달 남은일수 + 다음달 전액
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
              amount: firstPaymentAmount, // 첫달 남은일수 + 다음달 전액
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

      // 학생 정보 조회 (마지막 수업일 확인)
      const { data: fullStudentData } = await supabase
        .from('students')
        .select('last_class_date, status')
        .eq('id', studentId)
        .single();

      const lastClassDate = fullStudentData?.last_class_date;
      const studentStatus = fullStudentData?.status;

      // 그만둔 학생의 경우 마지막 수업일 이후의 결제 항목 삭제
      if (studentStatus === 'inactive' && lastClassDate) {
        const lastDate = new Date(lastClassDate);
        lastDate.setHours(0, 0, 0, 0);
        const lastDateStr = lastDate.toISOString().split('T')[0];

        // 마지막 수업일 이후의 모든 결제 항목 삭제
        await supabase
          .from('payments')
          .delete()
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .eq('type', 'payment')
          .gt('payment_date', lastDateStr);
      } else {
        // 첫달 다음 달 결제 항목 삭제 (첫달에 합쳐졌으므로)
        const nextMonth = firstMonth === 12 ? 1 : firstMonth + 1;
        const nextYear = firstMonth === 12 ? firstYear + 1 : firstYear;
        const nextMonthStart = new Date(nextYear, nextMonth - 1, 1);
        const nextMonthEnd = new Date(nextYear, nextMonth, 0);
        
        await supabase
          .from('payments')
          .delete()
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .eq('type', 'payment')
          .gte('payment_date', nextMonthStart.toISOString().split('T')[0])
          .lte('payment_date', nextMonthEnd.toISOString().split('T')[0]);

        // 첫 수업일 이후의 모든 결제 항목 재생성 (첫달 다음 달 다음 달부터)
        // 현재 날짜부터 12개월 후까지의 결제 항목 생성
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 12);

        let currentDate = new Date(firstMonthStart);
        currentDate.setMonth(currentDate.getMonth() + 2); // 첫 달 다음 달 다음 달부터 시작

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
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('student_id', studentId)
      .eq('type', 'refund');

    if (deleteError) {
      console.error('기존 환불 항목 삭제 오류:', deleteError);
    }

    // 마지막 수업일 이후의 선납 수강료 삭제
    if (newLastClassDate) {
      const lastDate = new Date(newLastClassDate);
      lastDate.setHours(0, 0, 0, 0);
      const lastDateStr = lastDate.toISOString().split('T')[0];

      // 마지막 수업일 이후의 모든 결제 항목 삭제
      const { error: deletePaymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('student_id', studentId)
        .eq('type', 'payment')
        .gt('payment_date', lastDateStr);

      if (deletePaymentsError) {
        console.error('선납 수강료 삭제 오류:', deletePaymentsError);
      }
    }

    // 새로운 마지막 수업일이 있으면 환불 생성
    if (newLastClassDate) {
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
        console.log('수강 중인 수업이 없어 환불 항목을 생성하지 않습니다.');
        return;
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

      const dueDay = studentData?.payment_due_day || 25;
      const lastDate = new Date(newLastClassDate);
      const lastYear = lastDate.getFullYear();
      const lastMonth = lastDate.getMonth() + 1;

      // 학생 정보에서 첫 수업일 확인
      const { data: fullStudentData } = await supabase
        .from('students')
        .select('first_class_date')
        .eq('id', studentId)
        .single();

      const firstClassDate = fullStudentData?.first_class_date 
        ? new Date(fullStudentData.first_class_date)
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
          const { calculateRefundAmount } = await import('./tuition');
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
          const { calculateRefundAmount } = await import('./tuition');
          refundAmount = calculateRefundAmount(
            course.tuition_fee,
            lastDate,
            lastYear,
            lastMonth
          );
        }

        if (refundAmount <= 0) {
          console.log(`환불 금액이 0이므로 스킵 (수업: ${course.name})`);
          continue;
        }

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
          console.log(`이미 환불이 존재하므로 스킵 (수업: ${course.name})`);
          continue;
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
        } else {
          console.log(`환불 항목 생성 완료 (수업: ${course.name}, 금액: ${refundAmount}원)`);
        }
      }
    }
  } catch (error) {
    console.error('마지막 수업일 변경 시 환불 항목 업데이트 오류:', error);
  }
}

