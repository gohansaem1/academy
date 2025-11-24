'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { calculateProportionalTuition } from '@/lib/utils/tuition';

interface ExcelRow {
  이름: string;
  전화번호: string;
  이메일?: string;
  주소?: string;
  보호자이름: string;
  보호자전화번호: string;
  결제일?: number;
  첫수업일?: string;
  수업명: string; // 쉼표로 구분된 수업명들
}

export default function UploadStudentsPage() {
  const { user, loading: authLoading } = useAuth('ADMIN');
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

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

  const downloadTemplate = () => {
    const templateData = [
      {
        이름: '홍길동',
        전화번호: '010-1234-5678',
        이메일: 'hong@example.com',
        주소: '서울시 강남구',
        보호자이름: '홍부모',
        보호자전화번호: '010-8765-4321',
        결제일: 25,
        첫수업일: '2025-01-15',
        수업명: '화목토 영어 기초반, 월수금 미술 기초반',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생 등록');
    
    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 10 }, // 이름
      { wch: 15 }, // 전화번호
      { wch: 20 }, // 이메일
      { wch: 25 }, // 주소
      { wch: 12 }, // 보호자이름
      { wch: 15 }, // 보호자전화번호
      { wch: 10 }, // 결제일
      { wch: 12 }, // 첫수업일
      { wch: 40 }, // 수업명
    ];

    XLSX.writeFile(workbook, '학생_등록_템플릿.xlsx');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        // 필수 필드 검증
        const requiredFields = ['이름', '전화번호', '보호자이름', '보호자전화번호', '수업명'];
        const missingFields = requiredFields.filter(field => 
          !jsonData[0] || !(field in jsonData[0])
        );

        if (missingFields.length > 0) {
          setErrors([`필수 컬럼이 없습니다: ${missingFields.join(', ')}`]);
          setPreview([]);
          return;
        }

        setPreview(jsonData.slice(0, 10)); // 처음 10개만 미리보기
      };
      reader.readAsBinaryString(selectedFile);
    } catch (error) {
      console.error('파일 읽기 오류:', error);
      setErrors(['파일을 읽는 중 오류가 발생했습니다.']);
    }
  };

  const formatPhone = (phone: string): string => {
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      setErrors([]);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        const uploadErrors: string[] = [];
        let successCount = 0;
        let skipCount = 0;

        // 모든 수업 목록 가져오기
        const { data: allCourses } = await supabase
          .from('courses')
          .select('id, name, capacity, tuition_fee');

        const courseMap = new Map<string, any>();
        allCourses?.forEach(course => {
          courseMap.set(course.name, course);
        });

        // 각 행 처리
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNum = i + 2; // 엑셀 행 번호 (헤더 제외)

          try {
            // 필수 필드 검증
            if (!row.이름 || !row.전화번호 || !row.보호자이름 || !row.보호자전화번호 || !row.수업명) {
              uploadErrors.push(`행 ${rowNum}: 필수 정보가 누락되었습니다.`);
              skipCount++;
              continue;
            }

            // 전화번호 형식 변환
            const phone = formatPhone(row.전화번호);
            const guardianPhone = formatPhone(row.보호자전화번호);

            // 이미 등록된 학생인지 확인
            const { data: existingStudent } = await supabase
              .from('students')
              .select('id')
              .eq('phone', phone)
              .single();

            if (existingStudent) {
              uploadErrors.push(`행 ${rowNum}: ${row.이름} - 이미 등록된 전화번호입니다.`);
              skipCount++;
              continue;
            }

            // 학생 등록
            const firstClassDate = row.첫수업일 
              ? new Date(row.첫수업일).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .insert([{
                name: row.이름,
                phone: phone,
                email: row.이메일 || null,
                address: row.주소 || null,
                guardian_name: row.보호자이름,
                guardian_phone: guardianPhone,
                payment_due_day: row.결제일 || 25,
                status: 'active',
                first_class_date: firstClassDate,
              }])
              .select()
              .single();

            if (studentError) {
              uploadErrors.push(`행 ${rowNum}: ${row.이름} - 학생 등록 실패: ${studentError.message}`);
              skipCount++;
              continue;
            }

            const studentId = studentData.id;
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const dueDay = row.결제일 || 25;

            // 수업명 파싱 (쉼표로 구분)
            const courseNames = row.수업명.split(',').map(name => name.trim()).filter(Boolean);

            // 각 수업에 등록
            for (const courseName of courseNames) {
              const course = courseMap.get(courseName);
              if (!course) {
                uploadErrors.push(`행 ${rowNum}: ${row.이름} - 수업 "${courseName}"을 찾을 수 없습니다.`);
                continue;
              }

              // 정원 체크
              const { data: enrollmentData } = await supabase
                .from('course_enrollments')
                .select('student_id, students!inner(status)')
                .eq('course_id', course.id);

              const activeCount = enrollmentData?.filter((item: any) => 
                item.students && (item.students.status === 'active' || !item.students.status)
              ).length || 0;

              if (activeCount >= course.capacity) {
                uploadErrors.push(`행 ${rowNum}: ${row.이름} - 수업 "${courseName}" 정원 초과 (${activeCount}/${course.capacity}명)`);
                continue;
              }

              // 수업 등록
              const { error: enrollError } = await supabase
                .from('course_enrollments')
                .insert([{
                  course_id: course.id,
                  student_id: studentId,
                }]);

              if (enrollError && enrollError.code !== '23505') {
                uploadErrors.push(`행 ${rowNum}: ${row.이름} - 수업 "${courseName}" 등록 실패`);
                continue;
              }

              // 결제일 계산
              let paymentDate = new Date(currentYear, currentMonth - 1, dueDay);
              if (paymentDate < today) {
                paymentDate.setMonth(paymentDate.getMonth() + 1);
              }

              // 첫달 결제 금액 계산
              const firstMonthAmount = calculateProportionalTuition(
                course.tuition_fee,
                new Date(firstClassDate),
                currentYear,
                currentMonth
              );
              const firstPaymentAmount = firstMonthAmount + course.tuition_fee;

              // 결제 항목 생성
              if (firstPaymentAmount > 0) {
                await supabase
                  .from('payments')
                  .insert([{
                    student_id: studentId,
                    course_id: course.id,
                    amount: firstPaymentAmount,
                    payment_method: 'card',
                    payment_date: paymentDate.toISOString().split('T')[0],
                    status: 'pending',
                    type: 'payment',
                  }]);
              }
            }

            successCount++;
          } catch (error: any) {
            uploadErrors.push(`행 ${rowNum}: ${row.이름} - 오류: ${error.message}`);
            skipCount++;
          }
        }

        setErrors(uploadErrors);
        
        if (successCount > 0) {
          alert(`업로드 완료!\n성공: ${successCount}명\n건너뜀: ${skipCount}명${uploadErrors.length > 0 ? `\n오류: ${uploadErrors.length}건` : ''}`);
          router.push('/students');
        } else {
          alert(`업로드 실패: 모든 항목을 처리할 수 없었습니다.`);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학생 일괄 등록</h1>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">엑셀 파일 업로드</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">
                  엑셀 파일 선택
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  템플릿 다운로드
                </Button>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">필수 컬럼:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 이름 (필수)</li>
                <li>• 전화번호 (필수, 형식: 010-1234-5678 또는 01012345678)</li>
                <li>• 보호자이름 (필수)</li>
                <li>• 보호자전화번호 (필수)</li>
                <li>• 수업명 (필수, 여러 개일 경우 쉼표로 구분)</li>
                <li>• 이메일 (선택)</li>
                <li>• 주소 (선택)</li>
                <li>• 결제일 (선택, 기본값: 25일)</li>
                <li>• 첫수업일 (선택, 기본값: 오늘, 형식: YYYY-MM-DD)</li>
              </ul>
            </div>
          </div>
        </div>

        {preview.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">미리보기 (최대 10개)</h3>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left border-b">이름</th>
                    <th className="p-2 text-left border-b">전화번호</th>
                    <th className="p-2 text-left border-b">보호자이름</th>
                    <th className="p-2 text-left border-b">수업명</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row.이름}</td>
                      <td className="p-2">{row.전화번호}</td>
                      <td className="p-2">{row.보호자이름}</td>
                      <td className="p-2">{row.수업명}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">오류 목록:</h3>
            <ul className="text-sm text-red-800 space-y-1 max-h-60 overflow-y-auto">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </div>
    </div>
  );
}

