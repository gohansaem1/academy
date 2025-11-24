import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Attendance } from '@/types/attendance';
import { LearningLog } from '@/types/learning-log';

const STATUS_LABELS = {
  present: '출석',
  late: '지각',
  absent: '결석',
  early: '조퇴',
};

export async function exportStudentMonthlyReport(
  studentName: string,
  year: number,
  month: number,
  attendances: Attendance[],
  learningLogs: LearningLog[]
) {
  // 월별 출석 데이터 정리
  const attendanceData = attendances.map(att => ({
    날짜: new Date(att.date).toLocaleDateString('ko-KR'),
    수업명: att.course_name || '-',
    출석상태: STATUS_LABELS[att.status] || att.status,
  }));

  // 출석 통계 계산
  const totalSessions = attendances.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const earlyCount = attendances.filter(a => a.status === 'early').length;
  const attendanceRate = totalSessions > 0 
    ? ((presentCount + lateCount + earlyCount) / totalSessions * 100).toFixed(1)
    : '0';

  // 학습일지 데이터 정리
  const learningLogData = learningLogs.map(log => {
    const studentComment = log.student_comments 
      ? Object.values(log.student_comments)[0] || ''
      : '';
    
    return {
      날짜: new Date(log.date).toLocaleDateString('ko-KR'),
      수업명: log.course_name || '-',
      강사명: log.instructor_name || '-',
      학습내용: log.content || '',
      개별코멘트: studentComment,
      숙제: log.homework || '',
      특이사항: log.notes || '',
    };
  });

  // 통계 시트 데이터
  const statsData = [
    ['학생명', studentName],
    ['기간', `${year}년 ${month}월`],
    [''],
    ['출석 통계'],
    ['총 수업일수', totalSessions],
    ['출석', presentCount],
    ['지각', lateCount],
    ['조퇴', earlyCount],
    ['결석', absentCount],
    ['출석률', `${attendanceRate}%`],
    [''],
    ['학습일지 수', learningLogs.length],
  ];

  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 통계 시트
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, '통계');

  // 출석 기록 시트
  if (attendanceData.length > 0) {
    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, '출석 기록');
  }

  // 학습일지 시트
  if (learningLogData.length > 0) {
    const learningLogSheet = XLSX.utils.json_to_sheet(learningLogData);
    XLSX.utils.book_append_sheet(workbook, learningLogSheet, '학습일지');
  }

  // 파일 저장
  const fileName = `${studentName}_${year}년${month}월_학습보고서.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

