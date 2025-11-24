'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types/student';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

export default function StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [downloading, setDownloading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 마지막 수업일이 현재 날짜보다 이전이면 자동으로 그만둔 상태로 변경
      const { autoUpdateStudentStatusIfNeeded } = await import('@/lib/utils/student-status');
      const updatePromises = (data || []).map((student: any) =>
        autoUpdateStudentStatusIfNeeded(student.id, student.status, student.last_class_date)
      );
      
      await Promise.all(updatePromises);
      
      // 업데이트 후 다시 조회
      const { data: updatedData, error: updatedError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!updatedError) {
        setStudents(updatedData || []);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
      alert('학생 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (selectedStudents.size === 0) {
      alert('삭제할 학생을 선택해주세요.');
      return;
    }
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  const verifyPassword = async (): Promise<boolean> => {
    if (!user?.email) {
      setPasswordError('사용자 정보를 찾을 수 없습니다.');
      return false;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        setPasswordError('비밀번호가 올바르지 않습니다.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      setPasswordError('비밀번호 확인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleDelete = async () => {
    const ids = Array.from(selectedStudents);
    if (ids.length === 0) {
      alert('삭제할 학생을 선택해주세요.');
      return;
    }

    // 비밀번호 확인
    const isValid = await verifyPassword();
    if (!isValid) {
      return;
    }

    setDeleting(true);
    try {
      // 학생 삭제 전에 관련된 데이터를 먼저 삭제해야 합니다
      // payments 테이블의 외래키가 ON DELETE RESTRICT로 설정되어 있음
      
      // 1. 결제 데이터 삭제
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .in('student_id', ids);

      if (paymentsError) {
        console.error('결제 데이터 삭제 오류:', paymentsError);
        throw new Error(`결제 데이터 삭제 실패: ${paymentsError.message}`);
      }

      // 2. 학습일지 데이터 삭제 (student_comments에 학생 ID가 포함된 경우)
      // 학습일지는 course_id로만 연결되어 있으므로 직접 삭제할 수 없지만,
      // student_comments에서 해당 학생의 코멘트를 제거하거나 전체 삭제는 하지 않음
      // (학습일지는 수업 단위이므로 학생 삭제 시 자동으로 처리되지 않음)

      // 3. 출석 데이터는 ON DELETE CASCADE로 자동 삭제됨
      // 4. 수업 등록 데이터는 ON DELETE CASCADE로 자동 삭제됨

      // 5. 학생 데이터 삭제
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .in('id', ids);

      if (studentsError) {
        console.error('학생 삭제 오류:', studentsError);
        throw new Error(`학생 삭제 실패: ${studentsError.message}`);
      }

      fetchStudents();
      setSelectedStudents(new Set());
      setShowPasswordModal(false);
      setPassword('');
      alert(`${ids.length}명의 학생이 삭제되었습니다.`);
    } catch (error: any) {
      console.error('학생 삭제 오류:', error);
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
      alert(`학생 삭제 중 오류가 발생했습니다.\n\n오류 내용: ${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm);
    const matchesStatus = activeTab === 'active' 
      ? (student.status === 'active' || !student.status) // 기본값은 active
      : student.status === 'inactive';
    return matchesSearch && matchesStatus;
  });

  const handleSelectStudent = (id: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleDownloadReports = async () => {
    if (selectedStudents.size === 0) {
      alert('다운로드할 학생을 선택해주세요.');
      return;
    }

    try {
      setDownloading(true);
      const workbook = XLSX.utils.book_new();
      const firstDayOfMonth = new Date(reportYear, reportMonth - 1, 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(reportYear, reportMonth, 0).toISOString().split('T')[0];

      const STATUS_LABELS = {
        present: '출석',
        late: '지각',
        absent: '결석',
        early: '조퇴',
      };

      // 선택된 각 학생에 대해 데이터 수집 및 시트 생성
      for (const studentId of Array.from(selectedStudents)) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        // 출석 데이터 가져오기
        const { data: monthlyAttendances } = await supabase
          .from('attendance')
          .select(`
            *,
            courses(name)
          `)
          .eq('student_id', studentId)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .order('date', { ascending: true });

        // 학생이 등록한 수업 ID 가져오기
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', studentId);

        const courseIds = enrollments?.map(e => e.course_id) || [];
        
        // 학습일지 가져오기
        const { data: monthlyLogs } = courseIds.length > 0 ? await supabase
          .from('learning_logs')
          .select(`
            *,
            courses:course_id(name),
            instructors:instructor_id(name)
          `)
          .in('course_id', courseIds)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .order('date', { ascending: true }) : { data: [] };

        const attendancesWithNames = (monthlyAttendances || []).map((att: any) => ({
          ...att,
          course_name: att.courses?.name,
        }));

        const logsWithNames = (monthlyLogs || []).map((log: any) => {
          let filteredComments = {};
          if (log.student_comments && log.student_comments[studentId]) {
            filteredComments = { [studentId]: log.student_comments[studentId] };
          }
          return {
            ...log,
            course_name: log.courses?.name,
            instructor_name: log.instructors?.name,
            student_comments: filteredComments,
          };
        });

        // 출석 통계 계산
        const totalSessions = attendancesWithNames.length;
        const presentCount = attendancesWithNames.filter(a => a.status === 'present').length;
        const lateCount = attendancesWithNames.filter(a => a.status === 'late').length;
        const absentCount = attendancesWithNames.filter(a => a.status === 'absent').length;
        const earlyCount = attendancesWithNames.filter(a => a.status === 'early').length;
        const attendanceRate = totalSessions > 0 
          ? ((presentCount + lateCount + earlyCount) / totalSessions * 100).toFixed(1)
          : '0';

        // 출석 기록 데이터
        const attendanceData = attendancesWithNames.map(att => ({
          날짜: new Date(att.date).toLocaleDateString('ko-KR'),
          수업명: att.course_name || '-',
          출석상태: STATUS_LABELS[att.status as keyof typeof STATUS_LABELS] || att.status,
        }));

        // 학습일지 데이터
        const learningLogData = logsWithNames.map(log => {
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

        // 학생별 하나의 시트에 모든 데이터 포함
        const sheetName = student.name.length > 31 ? student.name.substring(0, 31) : student.name;
        
        // 통합 데이터 생성
        const combinedData: any[] = [];
        
        // 1. 기본 정보 및 통계
        combinedData.push(['학생명', student.name]);
        combinedData.push(['기간', `${reportYear}년 ${reportMonth}월`]);
        combinedData.push(['']);
        combinedData.push(['출석 통계']);
        combinedData.push(['총 수업일수', totalSessions]);
        combinedData.push(['출석', presentCount]);
        combinedData.push(['지각', lateCount]);
        combinedData.push(['조퇴', earlyCount]);
        combinedData.push(['결석', absentCount]);
        combinedData.push(['출석률', `${attendanceRate}%`]);
        combinedData.push(['학습일지 수', logsWithNames.length]);
        combinedData.push(['']);
        combinedData.push(['']);
        
        // 2. 출석 기록 헤더
        combinedData.push(['출석 기록']);
        combinedData.push(['날짜', '수업명', '출석상태']);
        
        // 3. 출석 기록 데이터
        attendanceData.forEach(att => {
          combinedData.push([att.날짜, att.수업명, att.출석상태]);
        });
        
        combinedData.push(['']);
        combinedData.push(['']);
        
        // 4. 학습일지 헤더
        combinedData.push(['학습일지']);
        combinedData.push(['날짜', '수업명', '강사명', '학습내용', '개별코멘트', '숙제', '특이사항']);
        
        // 5. 학습일지 데이터
        learningLogData.forEach(log => {
          combinedData.push([
            log.날짜,
            log.수업명,
            log.강사명,
            log.학습내용,
            log.개별코멘트,
            log.숙제,
            log.특이사항,
          ]);
        });

        // 시트 생성
        const studentSheet = XLSX.utils.aoa_to_sheet(combinedData);
        
        // 컬럼 너비 설정
        studentSheet['!cols'] = [
          { wch: 12 }, // 날짜
          { wch: 20 }, // 수업명
          { wch: 10 }, // 출석상태/강사명
          { wch: 40 }, // 학습내용
          { wch: 30 }, // 개별코멘트
          { wch: 30 }, // 숙제
          { wch: 30 }, // 특이사항
        ];
        
        XLSX.utils.book_append_sheet(workbook, studentSheet, sheetName);
      }

      // 파일 저장
      const fileName = `${reportYear}년${reportMonth}월_학습보고서_${selectedStudents.size}명.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`보고서 다운로드 완료!\n선택된 학생 ${selectedStudents.size}명의 보고서가 생성되었습니다.`);
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('보고서 다운로드 오류:', error);
      alert('보고서 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학생 관리</h1>
        <div className="flex gap-2">
          <Link href="/students/upload">
            <Button variant="outline">엑셀 일괄 등록</Button>
          </Link>
          <Link href="/students/new">
            <Button>학생 등록</Button>
          </Link>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            재학생 ({students.filter(s => s.status === 'active' || !s.status).length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inactive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            그만둔 학생 ({students.filter(s => s.status === 'inactive').length})
          </button>
        </nav>
      </div>

      {/* 상단 액션 바 */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">년도:</label>
              <Input
                type="number"
                value={reportYear}
                onChange={(e) => setReportYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-24"
                min="2020"
                max="2100"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">월:</label>
              <Input
                type="number"
                value={reportMonth}
                onChange={(e) => {
                  const month = parseInt(e.target.value) || 1;
                  setReportMonth(Math.max(1, Math.min(12, month)));
                }}
                className="w-20"
                min="1"
                max="12"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                선택된 학생: <span className="text-blue-600">{selectedStudents.size}</span>명
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadReports}
              disabled={selectedStudents.size === 0 || downloading}
            >
              {downloading ? '다운로드 중...' : '보고서 다운로드'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={selectedStudents.size === 0}
            >
              선택 삭제 ({selectedStudents.size})
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="이름 또는 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <p className="mt-2 text-sm text-gray-500">
          총 {filteredStudents.length}명의 학생이 표시됩니다.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableHead>
                <TableHead className="font-semibold">이름</TableHead>
                <TableHead className="font-semibold">전화번호</TableHead>
                <TableHead className="font-semibold">이메일</TableHead>
                <TableHead className="font-semibold">보호자 이름</TableHead>
                <TableHead className="font-semibold">보호자 전화번호</TableHead>
                <TableHead className="font-semibold">상태</TableHead>
                <TableHead className="font-semibold">등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow 
                  key={student.id}
                  className="hover:bg-blue-50 transition-colors"
                  onClick={() => router.push(`/students/${student.id}`)}
                >
                  <TableCell>
                    <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{student.name}</TableCell>
                  <TableCell className="text-gray-700">{student.phone}</TableCell>
                  <TableCell className="text-gray-600">{student.email || '-'}</TableCell>
                  <TableCell className="text-gray-700">{student.guardian_name}</TableCell>
                  <TableCell className="text-gray-700">{student.guardian_phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      student.status === 'inactive' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {student.status === 'inactive' ? '그만둠' : '재학'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(student.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordError('');
        }}
        title="비밀번호 확인"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError('');
              }}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || !password}
            >
              {deleting ? '삭제 중...' : `삭제 (${selectedStudents.size}명)`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            선택한 <span className="font-semibold text-red-600">{selectedStudents.size}명</span>의 학생을 삭제하려면
            <br />
            비밀번호를 입력해주세요.
          </p>
          <Input
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            error={passwordError}
            placeholder="비밀번호를 입력하세요"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password && !deleting) {
                handleDelete();
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
}

