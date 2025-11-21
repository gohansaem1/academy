'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Payment } from '@/types/payment';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';
import { calculateProportionalTuition, calculateRefundAmount } from '@/lib/utils/tuition';

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
  student_first_class_date?: string | null;
  student_last_class_date?: string | null;
  student_status?: string | null;
  course_tuition_fee?: number | null;
}

type PaymentFilter = 'all' | 'overdue' | 'confirmed' | 'first_month' | 'refund';
type StatusFilter = {
  pending: boolean;
  confirmed: boolean;
};

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({ pending: false, confirmed: false });
  const [showAllPeriod, setShowAllPeriod] = useState(false);
  const [expectedRevenue, setExpectedRevenue] = useState<number | null>(null);
  const [loadingExpectedRevenue, setLoadingExpectedRevenue] = useState(false);
  const [refundRows, setRefundRows] = useState<Array<{
    id: string;
    student_id: string;
    student_name: string;
    course_id: string;
    course_name: string;
    amount: number;
    last_class_date: string;
    payment_date: string;
    status?: 'pending' | 'confirmed';
  }>>([]);
  const [editingRefundStatus, setEditingRefundStatus] = useState<Record<string, 'pending' | 'confirmed'>>({});
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    refundAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    previousOverdueAmount: 0,
  });

  useEffect(() => {
    fetchPayments();
    // 다음 달 조회 시 예상 매출액 계산
    if (!showAllPeriod) {
      checkIfNextMonth();
    } else {
      setExpectedRevenue(null);
    }
  }, [selectedMonth, showAllPeriod, paymentFilter]);

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
            students(name, payment_due_day, status, first_class_date, last_class_date),
            courses(name, tuition_fee)
          `)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false });

        // 재학생만 필터링 (환불 금액 필터 사용 시 그만둔 학생도 포함)
        const filteredData = (allData || []).map((payment: any) => ({
          ...payment,
          student_payment_due_day: payment.students?.payment_due_day,
          student_first_class_date: payment.students?.first_class_date,
          student_last_class_date: payment.students?.last_class_date,
          student_status: payment.students?.status,
          course_tuition_fee: payment.courses?.tuition_fee,
          student_name: payment.students?.name,
          course_name: payment.courses?.name,
        })).filter((payment: any) => {
          // 환불 금액 필터 사용 시 그만둔 학생도 포함
          if (paymentFilter === 'refund') {
            return payment.student_status === 'inactive' || 
                   !payment.student_status || 
                   payment.student_status === 'active';
          }
          // 기본적으로는 재학생만
          return !payment.student_status || 
                 payment.student_status === 'active';
        });

        data = filteredData;
        error = allError;
        previousPaymentsData = null; // 전체 기간일 때는 이전 데이터 불필요
      } else {
        // 선택된 월의 시작일과 종료일 계산
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // 해당 달의 결제 데이터 조회 (환불 금액 필터 사용 시 그만둔 학생의 결제도 포함)
        // 환불 금액 필터 사용 시 마지막 수업일이 선택된 달에 있는 그만둔 학생의 모든 결제 조회
        let query = supabase
          .from('payments')
          .select(`
            *,
            students(name, payment_due_day, status, first_class_date, last_class_date),
            courses(name, tuition_fee)
          `);
        
        if (paymentFilter === 'refund') {
          // 환불 금액 필터: 마지막 수업일이 선택된 달에 있는 그만둔 학생의 모든 결제 조회
          // 결제일 제한 없이 모든 결제 조회 (나중에 필터링)
          query = query.order('payment_date', { ascending: false })
                       .order('created_at', { ascending: false });
        } else {
          // 일반 필터: 해당 달의 결제만 조회
          query = query.gte('payment_date', startDate)
                       .lte('payment_date', endDate)
                       .order('payment_date', { ascending: false })
                       .order('created_at', { ascending: false });
        }
        
        const { data: monthData, error: monthError } = await query;

        // 환불 금액 필터 사용 시 그만둔 학생도 포함, 아니면 재학생만
        const filteredMonthData = (monthData || []).map((payment: any) => ({
          ...payment,
          student_payment_due_day: payment.students?.payment_due_day,
          student_first_class_date: payment.students?.first_class_date,
          student_last_class_date: payment.students?.last_class_date,
          student_status: payment.students?.status,
          course_tuition_fee: payment.courses?.tuition_fee,
          student_name: payment.students?.name,
          course_name: payment.courses?.name,
        })).filter((payment: any) => {
          // 환불 금액 필터 사용 시 그만둔 학생도 포함
          if (paymentFilter === 'refund') {
            return payment.student_status === 'inactive' || 
                   !payment.student_status || 
                   payment.student_status === 'active';
          }
          // 기본적으로는 재학생만
          return !payment.student_status || 
                 payment.student_status === 'active';
        });

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
        student_name: payment.student_name || payment.students?.name,
        student_payment_due_day: payment.student_payment_due_day || payment.students?.payment_due_day,
        student_first_class_date: payment.student_first_class_date || payment.students?.first_class_date,
        student_last_class_date: payment.student_last_class_date || payment.students?.last_class_date,
        student_status: payment.student_status || payment.students?.status,
        course_tuition_fee: payment.course_tuition_fee || payment.courses?.tuition_fee,
        course_name: payment.course_name || payment.courses?.name,
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
              student_first_class_date: payment.students?.first_class_date,
              student_last_class_date: payment.students?.last_class_date,
              student_status: payment.students?.status,
              course_tuition_fee: payment.courses?.tuition_fee,
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
  // 환불 금액 필터 사용 시 마지막 수업일이 선택된 달에 있는 그만둔 학생의 모든 결제 표시
  const currentMonthPayments = showAllPeriod
    ? payments.filter(p => p.status !== 'cancelled')
    : payments.filter(p => {
        // 환불 금액 필터 사용 시: 마지막 수업일이 선택된 달에 있는 그만둔 학생의 모든 결제 표시
        if (paymentFilter === 'refund' && p.student_status === 'inactive' && p.student_last_class_date) {
          const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
          const lastClassDate = new Date(p.student_last_class_date);
          return lastClassDate.getFullYear() === selectedYear &&
                 lastClassDate.getMonth() + 1 === selectedMonthNum &&
                 p.status !== 'cancelled';
        }
        // 일반 필터: 해당 달의 결제만
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

      // 상태 필터 (체크박스)
      if (statusFilter.pending || statusFilter.confirmed) {
        const isPending = payment.status === 'pending' || 
                         (payment.status !== 'completed' && payment.status !== 'confirmed' && payment.status !== 'cancelled');
        const isConfirmed = payment.status === 'confirmed' || payment.status === 'completed';
        
        if (statusFilter.pending && statusFilter.confirmed) {
          // 둘 다 선택: 미납 또는 완료
          if (!isPending && !isConfirmed) return false;
        } else if (statusFilter.pending) {
          // 미납만 선택
          if (!isPending) return false;
        } else if (statusFilter.confirmed) {
          // 완료만 선택
          if (!isConfirmed) return false;
        }
      }

      // 필터 선택
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
        case 'first_month':
          // 첫 달 금액: 첫 수업일이 결제일과 같은 달에 있는 경우
          if (!payment.student_first_class_date) return false;
          const firstClassDate = new Date(payment.student_first_class_date);
          const paymentDateForFirst = new Date(payment.payment_date);
          return firstClassDate.getFullYear() === paymentDateForFirst.getFullYear() &&
                 firstClassDate.getMonth() === paymentDateForFirst.getMonth() &&
                 payment.status !== 'cancelled';
        case 'refund':
          // 환불 금액 필터 선택 시 일반 결제 행은 표시하지 않음 (환불 금액 행만 표시)
          return false;
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
  const calculateStatistics = async () => {
    console.log('calculateStatistics called', { paymentFilter, selectedMonth, showAllPeriod });
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

    // 환불 금액 계산 (그만둔 학생의 마지막 수업일이 있는 달 기준)
    // 학생 데이터를 직접 조회하여 환불 금액 계산 및 환불 행 생성
    let totalRefundAmount = 0;
    const refundRowsData: Array<{
      id: string;
      student_id: string;
      student_name: string;
      course_id: string;
      course_name: string;
      amount: number;
      last_class_date: string;
      payment_date: string;
    }> = [];
    
    try {
      // 선택된 달 계산
      const [selectedYear, selectedMonthNum] = showAllPeriod 
        ? [null, null]
        : selectedMonth.split('-').map(Number);
      
      // 그만둔 학생 조회 (마지막 수업일이 있는 학생만)
      let query = supabase
        .from('students')
        .select(`
          id,
          name,
          last_class_date,
          course_enrollments!inner(
            course_id,
            courses!inner(
              id,
              name,
              tuition_fee
            )
          )
        `)
        .eq('status', 'inactive')
        .not('last_class_date', 'is', null);
      
      // 환불 금액 필터 선택 시 또는 전체 기간이 아닐 때는 마지막 수업일이 선택된 달에 있는 학생만 조회
      // 환불 금액 필터 선택 시에는 선택된 달의 환불만 표시
      if ((paymentFilter === 'refund' || !showAllPeriod) && selectedYear && selectedMonthNum) {
        const monthStart = new Date(selectedYear, selectedMonthNum - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonthNum, 0);
        query = query
          .gte('last_class_date', monthStart.toISOString().split('T')[0])
          .lte('last_class_date', monthEnd.toISOString().split('T')[0]);
      }
      
      const { data: inactiveStudents, error: studentsError } = await query;
      
      if (studentsError) {
        console.error('환불 금액 계산 - 학생 조회 오류:', studentsError);
      } else if (inactiveStudents) {
        // 기존 환불 상태 조회
        const studentIds = inactiveStudents.map((s: any) => s.id);
        const courseIds = inactiveStudents.flatMap((s: any) => 
          s.course_enrollments?.map((e: any) => e.course_id) || []
        );
        
        const { data: existingRefunds, error: refundsError } = await supabase
          .from('refunds')
          .select('*')
          .in('student_id', studentIds)
          .in('course_id', courseIds);
        
        const refundsMap = new Map<string, 'pending' | 'confirmed'>();
        if (existingRefunds && !refundsError) {
          existingRefunds.forEach((refund: any) => {
            const key = `${refund.student_id}-${refund.course_id}-${refund.last_class_date}`;
            refundsMap.set(key, refund.status);
          });
        }
        inactiveStudents.forEach((student: any) => {
          if (!student.last_class_date) return;
          
          const lastClassDate = new Date(student.last_class_date);
          const lastClassYear = lastClassDate.getFullYear();
          const lastClassMonth = lastClassDate.getMonth() + 1;
          
          if (student.course_enrollments && Array.isArray(student.course_enrollments)) {
            // 학생이 수강하는 모든 수업에 대해 환불 금액 계산
            student.course_enrollments.forEach((enrollment: any) => {
              const tuitionFee = enrollment.courses?.tuition_fee;
              if (tuitionFee) {
                const refundAmount = calculateRefundAmount(
                  tuitionFee,
                  lastClassDate,
                  lastClassYear,
                  lastClassMonth
                );
                
                if (refundAmount > 0) {
                  totalRefundAmount += refundAmount;
                  
                  // 환불 행 데이터 추가
                  const refundKey = `${student.id}-${enrollment.course_id}-${student.last_class_date}`;
                  const existingStatus = refundsMap.get(refundKey) || 'pending';
                  
                  refundRowsData.push({
                    id: `refund-${refundKey}`,
                    student_id: student.id,
                    student_name: student.name,
                    course_id: enrollment.course_id,
                    course_name: enrollment.courses?.name || '',
                    amount: refundAmount,
                    last_class_date: student.last_class_date,
                    payment_date: lastClassDate.toISOString().split('T')[0], // 마지막 수업일을 결제일로 사용
                    status: existingStatus, // DB에서 조회한 상태 또는 기본값: 미지급
                  });
                }
              }
            });
          }
        });
      }
      
      setRefundRows(refundRowsData);
      console.log('환불 행 데이터 생성:', refundRowsData.length, '개', refundRowsData);
    } catch (error) {
      console.error('환불 금액 계산 오류:', error);
    }

    // 결제액 (완료/확인된 결제 금액 합계)
    // 환불 금액은 별도 행으로 표시되므로 여기서는 차감하지 않음
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
      refundAmount: totalRefundAmount,
      paidAmount,
      overdueAmount,
      previousOverdueAmount,
    };
  };

  // 통계 계산 useEffect
  useEffect(() => {
    if (payments.length > 0 || showAllPeriod || paymentFilter === 'refund') {
      calculateStatistics().then(setStatistics).catch(console.error);
    }
  }, [payments, selectedMonth, showAllPeriod, paymentFilter]);

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
              {statistics.refundAmount > 0 && (
                <div className="text-xs text-red-500 mt-1">
                  환불: -{statistics.refundAmount.toLocaleString()}원
                </div>
              )}
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
      {statistics.refundAmount > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-800">환불 금액: {statistics.refundAmount.toLocaleString()}원</div>
              <div className="text-xs text-yellow-600 mt-1">그만둔 학생의 마지막 달 환불 금액이 포함되어 있습니다.</div>
            </div>
          </div>
        </div>
      )}

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
              <option value="first_month">첫 달 금액</option>
              <option value="refund">환불 금액</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              상태 필터
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilter.pending}
                  onChange={(e) => setStatusFilter({ ...statusFilter, pending: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">미납</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilter.confirmed}
                  onChange={(e) => setStatusFilter({ ...statusFilter, confirmed: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">완료</span>
              </label>
            </div>
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
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!confirm(`선택한 ${selectedPayments.size}개의 결제를 미납으로 변경하시겠습니까?`)) return;
                try {
                  const { error } = await supabase
                    .from('payments')
                    .update({ status: 'pending' })
                    .in('id', Array.from(selectedPayments));
                  if (error) throw error;
                  fetchPayments();
                  setSelectedPayments(new Set());
                  alert('선택한 결제가 미납으로 변경되었습니다.');
                } catch (error) {
                  console.error('일괄 미납 변경 오류:', error);
                  alert('결제 상태 변경 중 오류가 발생했습니다.');
                }
              }}
            >
              선택한 {selectedPayments.size}개 미납으로 변경
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
              {/* 환불 금액 행 (환불 금액 필터 선택 시 또는 전체 표시 시) */}
              {(paymentFilter === 'refund' || paymentFilter === 'all') && refundRows
                .filter(refundRow => {
                  // 검색어 필터
                  const matchesSearch = refundRow.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    refundRow.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
                  if (!matchesSearch) return false;
                  
                  // 환불 금액 필터 선택 시에만 표시
                  if (paymentFilter === 'refund') return true;
                  
                  // 전체 필터일 때는 마지막 수업일이 선택된 달에 있는 환불만 표시
                  if (!showAllPeriod) {
                    const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
                    const lastClassDate = new Date(refundRow.last_class_date);
                    return lastClassDate.getFullYear() === selectedYear &&
                           lastClassDate.getMonth() + 1 === selectedMonthNum;
                  }
                  return true;
                })
                .map((refundRow) => (
                  <TableRow key={refundRow.id} className="bg-red-50">
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-medium">
                      {refundRow.student_name || '-'}
                    </TableCell>
                    <TableCell>{refundRow.course_name || '-'}</TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      -{refundRow.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-gray-500">환불</TableCell>
                    <TableCell>{refundRow.payment_date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRefundStatus[refundRow.id] !== undefined
                            ? editingRefundStatus[refundRow.id]
                            : (refundRow.status || 'pending')}
                          onChange={(e) => {
                            setEditingRefundStatus({
                              ...editingRefundStatus,
                              [refundRow.id]: e.target.value as 'pending' | 'confirmed',
                            });
                          }}
                          className="flex h-8 w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <option value="pending">미지급</option>
                          <option value="confirmed">환불확인</option>
                        </select>
                        {editingRefundStatus[refundRow.id] !== undefined && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const newStatus = editingRefundStatus[refundRow.id];
                                
                                // DB에 환불 상태 저장 또는 업데이트
                                const refundData = {
                                  student_id: refundRow.student_id,
                                  course_id: refundRow.course_id,
                                  amount: refundRow.amount,
                                  last_class_date: refundRow.last_class_date,
                                  status: newStatus,
                                };
                                
                                // 기존 환불 레코드 확인
                                const { data: existingRefund, error: checkError } = await supabase
                                  .from('refunds')
                                  .select('id')
                                  .eq('student_id', refundRow.student_id)
                                  .eq('course_id', refundRow.course_id)
                                  .eq('last_class_date', refundRow.last_class_date)
                                  .maybeSingle();
                                
                                if (existingRefund) {
                                  // 기존 레코드 업데이트
                                  const { error: updateError } = await supabase
                                    .from('refunds')
                                    .update({ status: newStatus })
                                    .eq('id', existingRefund.id);
                                  
                                  if (updateError) throw updateError;
                                } else {
                                  // 새 레코드 생성
                                  const { error: insertError } = await supabase
                                    .from('refunds')
                                    .insert([refundData]);
                                  
                                  if (insertError) {
                                    // UNIQUE 제약 조건 위반 시 업데이트 시도
                                    if (insertError.code === '23505') {
                                      const { error: updateError } = await supabase
                                        .from('refunds')
                                        .update({ status: newStatus })
                                        .eq('student_id', refundRow.student_id)
                                        .eq('course_id', refundRow.course_id)
                                        .eq('last_class_date', refundRow.last_class_date);
                                      
                                      if (updateError) throw updateError;
                                    } else {
                                      throw insertError;
                                    }
                                  }
                                }
                                
                                // 로컬 상태 업데이트
                                const updatedRefundRows = refundRows.map(row => 
                                  row.id === refundRow.id 
                                    ? { ...row, status: newStatus }
                                    : row
                                );
                                setRefundRows(updatedRefundRows);
                                
                                // 편집 상태 초기화
                                const newEditingStatus = { ...editingRefundStatus };
                                delete newEditingStatus[refundRow.id];
                                setEditingRefundStatus(newEditingStatus);
                              } catch (error) {
                                console.error('환불 상태 수정 오류:', error);
                                alert('환불 상태 수정 중 오류가 발생했습니다.');
                              }
                            }}
                          >
                            확인
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPayments.map((payment) => {
                const dueStatus = payment.dueStatus || null;
                const statusLabel = dueStatus === 'paid' || !dueStatus 
                  ? STATUS_LABELS[payment.status as keyof typeof STATUS_LABELS]
                  : getDueStatusLabel(dueStatus, payment.status);
                const statusColor = dueStatus === 'paid' || !dueStatus
                  ? STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]
                  : getDueStatusColor(dueStatus, payment.status);

                // 결제일 기준으로 연도와 월 추출
                const paymentDate = new Date(payment.payment_date);
                const paymentYear = paymentDate.getFullYear();
                const paymentMonth = paymentDate.getMonth() + 1;
                
                // 첫 달인지 확인 (첫 수업일이 해당 달에 있는지)
                const isFirstMonth = payment.student_first_class_date && (() => {
                  const firstClassDate = new Date(payment.student_first_class_date);
                  return firstClassDate.getFullYear() === paymentYear && 
                         firstClassDate.getMonth() + 1 === paymentMonth;
                })();
                
                // 마지막 달인지 확인 (마지막 수업일이 해당 달에 있고 학생이 그만둔 상태인지)
                const isLastMonth = payment.student_status === 'inactive' && 
                                    payment.student_last_class_date && (() => {
                  const lastClassDate = new Date(payment.student_last_class_date);
                  return lastClassDate.getFullYear() === paymentYear && 
                         lastClassDate.getMonth() + 1 === paymentMonth;
                })();
                
                // 첫 달 계산 금액
                let displayAmount = payment.amount;
                if (isFirstMonth && payment.student_first_class_date && payment.course_tuition_fee) {
                  const firstClassDate = new Date(payment.student_first_class_date);
                  displayAmount = calculateProportionalTuition(
                    payment.course_tuition_fee,
                    firstClassDate,
                    paymentYear,
                    paymentMonth
                  );
                }
                
                // 마지막 달 환불 금액
                let refundAmount = 0;
                if (isLastMonth && payment.student_last_class_date && payment.course_tuition_fee) {
                  const lastClassDate = new Date(payment.student_last_class_date);
                  refundAmount = calculateRefundAmount(
                    payment.course_tuition_fee,
                    lastClassDate,
                    paymentYear,
                    paymentMonth
                  );
                }

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
                      <TableCell></TableCell>
                      <TableCell className="font-medium">
                        {payment.student_name || '-'}
                      </TableCell>
                    <TableCell>{payment.course_name || '-'}</TableCell>
                    <TableCell>
                      {refundAmount > 0 ? (
                        <div className="text-red-600 font-semibold">
                          -{refundAmount.toLocaleString()}원
                        </div>
                      ) : (
                        <div>
                          {displayAmount.toLocaleString()}원
                          {isFirstMonth && displayAmount !== payment.amount && (
                            <span className="text-xs text-gray-500 ml-1">(첫달)</span>
                          )}
                        </div>
                      )}
                    </TableCell>
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

