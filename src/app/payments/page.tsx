'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Payment } from '@/types/payment';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';

const PAYMENT_METHODS = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
};

const STATUS_LABELS = {
  completed: '완료',
  pending: '대기',
  confirmed: '확인됨',
  cancelled: '취소',
};

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

// 결제일 기준 상태 타입
type PaymentDueStatus = 'week_before' | 'day_before' | 'today' | 'overdue' | 'paid' | null;

interface PaymentWithDueStatus extends Payment {
  dueStatus?: PaymentDueStatus;
}

interface PaymentWithStudent extends Payment {
  student_payment_due_day?: number | null;
}

type PaymentFilter = 'all' | 'overdue' | 'confirmed';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [editingPayments, setEditingPayments] = useState<Record<string, { payment_method?: string; payment_date?: string; status?: string }>>({});
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [showAllPeriod, setShowAllPeriod] = useState(false);
  const [expectedRevenue, setExpectedRevenue] = useState<number | null>(null);
  const [loadingExpectedRevenue, setLoadingExpectedRevenue] = useState(false);

  useEffect(() => {
    fetchPayments();
    // 다음 달 조회 시 예상 매출액 계산
    if (!showAllPeriod) {
      checkIfNextMonth();
    } else {
      setExpectedRevenue(null);
    }
  }, [selectedMonth, showAllPeriod]);

  // 선택된 월이 다음 달인지 확인하고 예상 매출액 계산
  const checkIfNextMonth = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
    
    // 다음 달 계산
    let nextMonth: number;
    let nextYear: number;
    if (currentMonth === 12) {
      nextMonth = 1;
      nextYear = currentYear + 1;
    } else {
      nextMonth = currentMonth + 1;
      nextYear = currentYear;
    }
    
    // 선택된 월이 다음 달인지 확인
    if (selectedYear === nextYear && selectedMonthNum === nextMonth) {
      await fetchExpectedRevenue(selectedYear, selectedMonthNum);
    } else {
      setExpectedRevenue(null);
    }
  };

  // 다음 달 예상 매출액 계산
  const fetchExpectedRevenue = async (year: number, month: number) => {
    try {
      setLoadingExpectedRevenue(true);
      
      // 재학생 조회
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, payment_due_day')
        .or('status.is.null,status.eq.active');
      
      if (studentsError) throw studentsError;
      
      if (!activeStudents || activeStudents.length === 0) {
        setExpectedRevenue(0);
        setLoadingExpectedRevenue(false);
        return;
      }
      
      // 각 학생의 등록된 수업 조회
      const studentIds = activeStudents.map(s => s.id);
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          courses(tuition_fee)
        `)
        .in('student_id', studentIds);
      
      if (enrollmentsError) throw enrollmentsError;
      
      // 학생별 수강료 합계 계산
      const studentTuitionMap = new Map<string, number>();
      (enrollments || []).forEach((enrollment: any) => {
        const studentId = enrollment.student_id;
        const tuitionFee = enrollment.courses?.tuition_fee || 0;
        const currentTotal = studentTuitionMap.get(studentId) || 0;
        studentTuitionMap.set(studentId, currentTotal + tuitionFee);
      });
      
      // 다음 달 결제일 계산 및 예상 매출액 합산
      let totalExpectedRevenue = 0;
      const nextMonthLastDay = new Date(year, month, 0).getDate();
      
      activeStudents.forEach(student => {
        const dueDay = student.payment_due_day || 25;
        // 결제일이 해당 월의 마지막 날보다 크면 마지막 날로 조정
        const adjustedDueDay = Math.min(dueDay, nextMonthLastDay);
        const paymentDate = new Date(year, month - 1, adjustedDueDay);
        
        // 다음 달 결제일이 해당 월에 포함되는지 확인
        if (paymentDate.getMonth() === month - 1 && paymentDate.getFullYear() === year) {
          const studentTuition = studentTuitionMap.get(student.id) || 0;
          totalExpectedRevenue += studentTuition;
        }
      });
      
      setExpectedRevenue(totalExpectedRevenue);
    } catch (error) {
      console.error('예상 매출액 계산 오류:', error);
      setExpectedRevenue(null);
    } finally {
      setLoadingExpectedRevenue(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      let data, error, previousPaymentsData, previousPaymentsError;

      if (showAllPeriod) {
        // 전체 기간 조회 (재학생만)
        const { data: allData, error: allError } = await supabase
          .from('payments')
          .select(`
            *,
            students(name, payment_due_day, status),
            courses(name)
          `)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false });

        // 재학생만 필터링
        const filteredData = (allData || []).filter((payment: any) => 
          !payment.students || 
          payment.students.status === 'active' || 
          !payment.students.status
        );

        data = filteredData;
        error = allError;
        previousPaymentsData = null; // 전체 기간일 때는 이전 데이터 불필요
      } else {
        // 선택된 월의 시작일과 종료일 계산
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // 해당 달의 결제 데이터 조회 (학생의 결제일 정보 포함, 재학생만)
        const { data: monthData, error: monthError } = await supabase
          .from('payments')
          .select(`
            *,
            students(name, payment_due_day, status),
            courses(name)
          `)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false });

        // 재학생만 필터링
        const filteredMonthData = (monthData || []).filter((payment: any) => 
          !payment.students || 
          payment.students.status === 'active' || 
          !payment.students.status
        );

        data = filteredMonthData;
        error = monthError;

        // 현재 달 이전의 모든 미납 데이터 조회 (지난 달까지 미납 총액 계산용, 재학생만)
        const currentMonthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        
        const { data: prevData, error: prevError } = await supabase
          .from('payments')
          .select(`
            *,
            students(name, payment_due_day, status),
            courses(name)
          `)
          .lt('payment_date', currentMonthStart); // 현재 달 이전의 모든 결제

        // 재학생만 필터링
        const filteredPrevData = (prevData || []).filter((payment: any) => 
          !payment.students || 
          payment.students.status === 'active' || 
          !payment.students.status
        );

        previousPaymentsData = filteredPrevData;
        previousPaymentsError = prevError;

        if (previousPaymentsError) {
          console.error('이전 결제 데이터 조회 오류:', previousPaymentsError);
        }
      }

      if (error) throw error;

      const paymentsWithNames = (data || []).map((payment: any) => ({
        ...payment,
        student_name: payment.students?.name,
        student_payment_due_day: payment.students?.payment_due_day,
        course_name: payment.courses?.name,
      }));

      // 현재 달 이전 데이터도 포함 (통계 계산용, 전체 기간이 아닐 때만)
      const allPayments = showAllPeriod
        ? paymentsWithNames
        : [
            ...paymentsWithNames,
            ...((previousPaymentsData || []).map((payment: any) => ({
              ...payment,
              student_name: payment.students?.name,
              student_payment_due_day: payment.students?.payment_due_day,
              course_name: payment.courses?.name,
            })))
          ];

      setPayments(allPayments);
      setSelectedPayments(new Set()); // 월 변경 시 선택 초기화
    } catch (error) {
      console.error('결제 이력 조회 오류:', error);
      alert('결제 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 결제일 기준 상태 계산 함수
  const getPaymentDueStatus = (payment: Payment): PaymentDueStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date(payment.payment_date);
    paymentDate.setHours(0, 0, 0, 0);
    
    // 이미 완료된 결제
    if (payment.status === 'completed' || payment.status === 'confirmed') {
      return 'paid';
    }

    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 7) {
      return 'week_before';
    } else if (diffDays === 1) {
      return 'day_before';
    } else if (diffDays === 0) {
      return 'today';
    } else if (diffDays < 0) {
      return 'overdue';
    }

    return null;
  };

  const getDueStatusLabel = (status: PaymentDueStatus, paymentStatus: string): string => {
    switch (status) {
      case 'week_before':
        return '1주일 전';
      case 'day_before':
        return '1일 전';
      case 'today':
        return '당일';
      case 'overdue':
        return '미납';
      case 'paid':
        return STATUS_LABELS[paymentStatus as keyof typeof STATUS_LABELS];
      default:
        return STATUS_LABELS[paymentStatus as keyof typeof STATUS_LABELS];
    }
  };

  const getDueStatusColor = (status: PaymentDueStatus, paymentStatus: string): string => {
    switch (status) {
      case 'week_before':
        return 'bg-blue-100 text-blue-800';
      case 'day_before':
        return 'bg-orange-100 text-orange-800';
      case 'today':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-200 text-red-900 font-bold';
      case 'paid':
        return STATUS_COLORS[paymentStatus as keyof typeof STATUS_COLORS];
      default:
        return STATUS_COLORS[paymentStatus as keyof typeof STATUS_COLORS];
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('입금을 확인하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
      fetchPayments();
      alert('입금이 확인되었습니다.');
    } catch (error) {
      console.error('입금 확인 오류:', error);
      alert('입금 확인 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('정말 취소하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      fetchPayments();
      alert('결제가 취소되었습니다.');
    } catch (error) {
      console.error('결제 취소 오류:', error);
      alert('결제 취소 중 오류가 발생했습니다.');
    }
  };

  const handleSelectPayment = (id: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedPayments.size === 0) {
      alert('확인할 결제를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedPayments.size}개의 결제를 확인하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .in('id', Array.from(selectedPayments));

      if (error) throw error;
      fetchPayments();
      alert('선택한 결제가 확인되었습니다.');
    } catch (error) {
      console.error('일괄 확인 오류:', error);
      alert('결제 확인 중 오류가 발생했습니다.');
    }
  };

  const handleEditPayment = (paymentId: string, field: 'payment_method' | 'payment_date' | 'status', value: string) => {
    setEditingPayments(prev => ({
      ...prev,
      [paymentId]: {
        ...prev[paymentId],
        [field]: value,
      },
    }));
  };

  const handleSavePayment = async (paymentId: string) => {
    const edits = editingPayments[paymentId];
    if (!edits || Object.keys(edits).length === 0) return;

    try {
      const updateData: any = {};
      if (edits.payment_method !== undefined) updateData.payment_method = edits.payment_method;
      if (edits.payment_date !== undefined) updateData.payment_date = edits.payment_date;
      if (edits.status !== undefined) updateData.status = edits.status;

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // 편집 상태 초기화
      setEditingPayments(prev => {
        const newState = { ...prev };
        delete newState[paymentId];
        return newState;
      });

      fetchPayments();
    } catch (error) {
      console.error('결제 수정 오류:', error);
      alert('결제 수정 중 오류가 발생했습니다.');
    }
  };

  const getDefaultPaymentDate = (payment: PaymentWithStudent): string => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const dueDay = payment.student_payment_due_day || 25;
    return `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
  };

  // 해당 달의 결제만 필터링 (표시용, 전체 기간이 아닐 때만)
  const currentMonthPayments = showAllPeriod
    ? payments.filter(p => p.status !== 'cancelled')
    : payments.filter(p => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const paymentDate = new Date(p.payment_date);
        const paymentMonth = paymentDate.getMonth() + 1;
        const paymentYear = paymentDate.getFullYear();
        return paymentMonth === month && paymentYear === year && p.status !== 'cancelled';
      });

  const filteredPayments = currentMonthPayments
    .map(payment => ({
      ...payment,
      dueStatus: getPaymentDueStatus(payment),
    }))
    .filter(payment => {
      // 검색어 필터
      const matchesSearch = payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 상태 필터
      switch (paymentFilter) {
        case 'overdue':
          // 미납: pending 상태이거나 결제일이 지났지만 아직 완료되지 않은 경우
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const paymentDate = new Date(payment.payment_date);
          paymentDate.setHours(0, 0, 0, 0);
          return (payment.status === 'pending' || 
                  (paymentDate < today && payment.status !== 'completed' && payment.status !== 'confirmed')) &&
                 payment.status !== 'cancelled';
        case 'confirmed':
          // 입금확인: confirmed 또는 completed 상태
          return payment.status === 'confirmed' || payment.status === 'completed';
        case 'all':
        default:
          // 전체: 취소 제외
          return payment.status !== 'cancelled';
      }
    });

  // 편집 중인 항목이 변경되었는지 확인
  const hasChanges = (paymentId: string): boolean => {
    const edits = editingPayments[paymentId];
    if (!edits || Object.keys(edits).length === 0) return false;
    
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return false;

    if (edits.payment_method !== undefined && edits.payment_method !== payment.payment_method) return true;
    if (edits.payment_date !== undefined && edits.payment_date !== payment.payment_date) return true;
    if (edits.status !== undefined) {
      // 현재 상태를 pending 또는 confirmed로 변환
      const currentStatus = (payment.status === 'completed' || payment.status === 'confirmed') ? 'confirmed' : 'pending';
      if (edits.status !== currentStatus) return true;
    }
    
    return false;
  };

  // 결제 상태를 표시용으로 변환 (pending -> pending, confirmed/completed -> confirmed)
  const getDisplayStatus = (payment: PaymentWithStudent): 'pending' | 'confirmed' => {
    return (payment.status === 'completed' || payment.status === 'confirmed') ? 'confirmed' : 'pending';
  };

  // 통계 계산
  const calculateStatistics = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 전체 기간일 때는 모든 결제, 아니면 해당 달의 결제만
    const paymentsForStats = showAllPeriod
      ? payments.filter(p => p.status !== 'cancelled')
      : payments.filter(p => {
          const [year, month] = selectedMonth.split('-').map(Number);
          const paymentDate = new Date(p.payment_date);
          const paymentMonth = paymentDate.getMonth() + 1;
          const paymentYear = paymentDate.getFullYear();
          return paymentMonth === month && paymentYear === year && p.status !== 'cancelled';
        });

    // 매출액 (모든 결제 금액 합계, 취소 제외)
    const totalRevenue = paymentsForStats.reduce((sum, p) => sum + p.amount, 0);

    // 결제액 (완료/확인된 결제 금액 합계)
    const paidAmount = paymentsForStats
      .filter(p => p.status === 'completed' || p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    // 미납액 (결제일이 지났지만 아직 완료되지 않은 결제, 또는 상태가 pending인 결제)
    const overdueAmount = paymentsForStats
      .filter(p => {
        const paymentDate = new Date(p.payment_date);
        paymentDate.setHours(0, 0, 0, 0);
        // 결제일이 지났거나 상태가 pending인 경우 미납으로 간주
        return (paymentDate < today || p.status === 'pending') &&
               p.status !== 'completed' && 
               p.status !== 'confirmed' &&
               p.status !== 'cancelled';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // 지난 달까지 미납 총액 계산 (전체 기간일 때는 0, 아니면 현재 달 이전 미납액)
    let previousOverdueAmount = 0;
    
    if (!showAllPeriod) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const currentMonthStartDate = new Date(year, month - 1, 1);
      currentMonthStartDate.setHours(0, 0, 0, 0);
      
      previousOverdueAmount = payments
        .filter(p => {
          const paymentDate = new Date(p.payment_date);
          paymentDate.setHours(0, 0, 0, 0);
          
          // 현재 달 이전의 결제이고, 결제일이 지났으며, 아직 완료되지 않음
          return paymentDate < currentMonthStartDate &&
                 paymentDate < today &&
                 p.status !== 'completed' && 
                 p.status !== 'confirmed' &&
                 p.status !== 'cancelled';
        })
        .reduce((sum, p) => sum + p.amount, 0);
    }

    return {
      totalRevenue,
      paidAmount,
      overdueAmount,
      previousOverdueAmount,
    };
  };

  const statistics = calculateStatistics();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">수강료 관리</h1>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          {expectedRevenue !== null ? (
            <>
              <div className="text-sm text-blue-600 mb-1 font-medium">다음 달 예상 매출액</div>
              <div className="text-2xl font-bold text-blue-600">
                {loadingExpectedRevenue ? (
                  <span className="text-sm">계산 중...</span>
                ) : (
                  `${expectedRevenue.toLocaleString()}원`
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">재학생 기준 예상</div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-1">해당 달 매출액</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.totalRevenue.toLocaleString()}원
              </div>
            </>
          )}
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">결제액</div>
          <div className="text-2xl font-bold text-green-600">
            {statistics.paidAmount.toLocaleString()}원
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">미납액</div>
          <div className="text-2xl font-bold text-red-600">
            {statistics.overdueAmount.toLocaleString()}원
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">지난 달까지 미납 총액</div>
          <div className="text-2xl font-bold text-orange-600">
            {statistics.previousOverdueAmount.toLocaleString()}원
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              월별 조회
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
                disabled={showAllPeriod}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllPeriod}
                  onChange={(e) => setShowAllPeriod(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">전체 기간</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              필터
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="flex h-10 w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="overdue">미납</option>
              <option value="confirmed">입금확인</option>
            </select>
          </div>
          <Input
            placeholder="학생명 또는 수업명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        {selectedPayments.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkConfirm}
            >
              선택한 {selectedPayments.size}개 확인
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPayments(new Set())}
            >
              선택 해제
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 결제가 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </TableHead>
                <TableHead>학생명</TableHead>
                <TableHead>수업명</TableHead>
                <TableHead>결제 금액</TableHead>
                <TableHead>결제 방법</TableHead>
                <TableHead>결제일</TableHead>
                <TableHead>확인 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const dueStatus = payment.dueStatus || null;
                const statusLabel = dueStatus === 'paid' || !dueStatus 
                  ? STATUS_LABELS[payment.status as keyof typeof STATUS_LABELS]
                  : getDueStatusLabel(dueStatus, payment.status);
                const statusColor = dueStatus === 'paid' || !dueStatus
                  ? STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]
                  : getDueStatusColor(dueStatus, payment.status);

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.student_name || '-'}
                    </TableCell>
                    <TableCell>{payment.course_name || '-'}</TableCell>
                    <TableCell>{payment.amount.toLocaleString()}원</TableCell>
                    <TableCell>
                      <select
                        value={editingPayments[payment.id]?.payment_method !== undefined 
                          ? editingPayments[payment.id].payment_method 
                          : (payment.payment_method || 'card')}
                        onChange={(e) => {
                          handleEditPayment(payment.id, 'payment_method', e.target.value);
                          handleSavePayment(payment.id);
                        }}
                        className="flex h-8 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <option value="card">카드</option>
                        <option value="cash">현금</option>
                        <option value="transfer">계좌이체</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={editingPayments[payment.id]?.payment_date !== undefined
                          ? editingPayments[payment.id].payment_date!
                          : (payment.payment_date || getDefaultPaymentDate(payment))}
                        onChange={(e) => handleEditPayment(payment.id, 'payment_date', e.target.value)}
                        onBlur={() => handleSavePayment(payment.id)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={editingPayments[payment.id]?.status !== undefined
                            ? editingPayments[payment.id].status!
                            : getDisplayStatus(payment)}
                          onChange={(e) => handleEditPayment(payment.id, 'status', e.target.value)}
                          className="flex h-8 w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <option value="pending">미납</option>
                          <option value="confirmed">입금확인</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleSavePayment(payment.id)}
                          disabled={!hasChanges(payment.id)}
                        >
                          확인
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

