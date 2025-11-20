/**
 * 학생 상태 자동 업데이트 유틸리티 함수
 */

/**
 * 마지막 수업일 이후 자동으로 그만둔 상태로 변경해야 하는지 확인
 * @param lastClassDate 마지막 수업일
 * @returns 그만둔 상태로 변경해야 하면 true
 */
export function shouldAutoInactivate(lastClassDate: string | null | undefined): boolean {
  if (!lastClassDate) return false;
  
  const lastDate = new Date(lastClassDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  
  // 마지막 수업일이 오늘보다 이전이면 그만둔 상태로 변경
  return lastDate < today;
}

/**
 * 학생 상태를 자동으로 업데이트 (마지막 수업일 기준)
 * @param studentId 학생 ID
 * @param currentStatus 현재 상태
 * @param lastClassDate 마지막 수업일
 * @returns 업데이트가 필요하면 true
 */
export function shouldUpdateStudentStatus(
  currentStatus: string | null | undefined,
  lastClassDate: string | null | undefined
): boolean {
  // 재학 상태이고 마지막 수업일이 있으면 체크
  if (currentStatus === 'active' || !currentStatus) {
    return shouldAutoInactivate(lastClassDate);
  }
  return false;
}

