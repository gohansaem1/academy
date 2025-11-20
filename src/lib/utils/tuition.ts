/**
 * 수강료 계산 유틸리티 함수
 */

/**
 * 수업 스케줄에서 특정 기간 내의 수업 일수를 계산합니다.
 * @param schedule 수업 스케줄 배열
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 수업 일수
 */
export function calculateClassDays(
  schedule: Array<{ day_of_week: number }>,
  startDate: Date,
  endDate: Date
): number {
  if (!schedule || schedule.length === 0) return 0;

  let classDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // JavaScript: 0=일요일, 1=월요일, ..., 6=토요일
    // PostgreSQL의 EXTRACT(DOW FROM date)도 0=일요일, 1=월요일, ..., 6=토요일
    if (schedule.some(s => s.day_of_week === dayOfWeek)) {
      classDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return classDays;
}

/**
 * 해당 달의 총 수업 일수를 계산합니다.
 * @param schedule 수업 스케줄 배열
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 총 수업 일수
 */
export function calculateMonthlyClassDays(
  schedule: Array<{ day_of_week: number }>,
  year: number,
  month: number
): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  return calculateClassDays(schedule, firstDay, lastDay);
}

/**
 * 첫 수업일부터 해당 달 말일까지의 수업 일수를 계산합니다.
 * @param schedule 수업 스케줄 배열
 * @param firstClassDate 첫 수업일
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 수업 일수
 */
export function calculateRemainingClassDays(
  schedule: Array<{ day_of_week: number }>,
  firstClassDate: Date,
  year: number,
  month: number
): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDate = firstClassDate > firstDay ? firstClassDate : firstDay;
  return calculateClassDays(schedule, startDate, lastDay);
}

/**
 * 해당 달 1일부터 마지막 수업일까지의 수업 일수를 계산합니다.
 * @param schedule 수업 스케줄 배열
 * @param lastClassDate 마지막 수업일
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 수업 일수
 */
export function calculateAttendedClassDays(
  schedule: Array<{ day_of_week: number }>,
  lastClassDate: Date,
  year: number,
  month: number
): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const endDate = lastClassDate < lastDay ? lastClassDate : lastDay;
  return calculateClassDays(schedule, firstDay, endDate);
}

/**
 * 첫 수업일 기준으로 해당 달 남은 수업 금액을 계산합니다.
 * @param monthlyTuition 월 수강료
 * @param schedule 수업 스케줄 배열
 * @param firstClassDate 첫 수업일
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 계산된 수강료
 */
export function calculateProportionalTuition(
  monthlyTuition: number,
  schedule: Array<{ day_of_week: number }>,
  firstClassDate: Date,
  year: number,
  month: number
): number {
  const totalDays = calculateMonthlyClassDays(schedule, year, month);
  if (totalDays === 0) return 0;
  
  const remainingDays = calculateRemainingClassDays(schedule, firstClassDate, year, month);
  return Math.round((monthlyTuition * remainingDays) / totalDays);
}

/**
 * 마지막 수업일 기준으로 미수업 부분 환불 금액을 계산합니다.
 * @param monthlyTuition 월 수강료
 * @param schedule 수업 스케줄 배열
 * @param lastClassDate 마지막 수업일
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 환불 금액
 */
export function calculateRefundAmount(
  monthlyTuition: number,
  schedule: Array<{ day_of_week: number }>,
  lastClassDate: Date,
  year: number,
  month: number
): number {
  const totalDays = calculateMonthlyClassDays(schedule, year, month);
  if (totalDays === 0) return 0;
  
  const attendedDays = calculateAttendedClassDays(schedule, lastClassDate, year, month);
  const unattendedDays = totalDays - attendedDays;
  
  return Math.round((monthlyTuition * unattendedDays) / totalDays);
}

