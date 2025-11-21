'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Payment } from '@/types/payment';
import Button from '@/components/common/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';
import Input from '@/components/common/Input';
import { calculateRefundAmount } from '@/lib/utils/tuition';

const PAYMENT_METHODS = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
};

const STATUS_LABELS = {
  pending: '미납',
  confirmed: '입금확인',
  cancelled: '취소',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type PaymentType = 'all' | 'payment' | 'refund';
type PaymentStatus = 'all' | 'pending' | 'confirmed';

interface Statistics {
  totalRevenue: number; // 총 매출액 (결제 - 환불)
  totalPayments: number; // 총 결제액
  totalRefunds: number; // 총 환불액
  confirmedPayments: number; // 입금 확인된 결제액
  confirmedRefunds: number; // 환불 확인된 환불액
  pendingPayments: number; // 미납 결제액
  pendingRefunds: number; // 미지급 환불액
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAllPeriod, setShowAllPeriod] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PaymentType>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>('all');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [editingPayments, setEditingPayments] = useState<Record<string, {
    payment_method?: string;
    payment_date?: string;
    status?: 'pending' | 'confirmed';
  }>>({});
  const [statistics, setStatistics] = useState<Statistics>({
    totalRevenue: 0,
    totalPayments: 0,
    totalRefunds: 0,
    confirmedPayments: 0,
    confirmedRefunds: 0,
    pendingPayments: 0,
    pendingRefunds: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, showAllPeriod]);

  useEffect(() => {
    calculateStatistics();
  }, [payments, typeFilter, statusFilter, selectedMonth, showAllPeriod]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // 학생, 수업 정보와 함께 조회
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students!inner(
            id,
            name,
            payment_due_day,
            first_class_date,
            last_class_date,
            status
          ),
          courses!inner(
            id,
            name,
            tuition_fee
          )
        `)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 타입 변환
      const paymentsWithDetails: Payment[] = (data || []).map((p: any) => ({
        ...p,
        student_name: p.students?.name,
        course_name: p.courses?.name,
        student_payment_due_day: p.students?.payment_due_day,
        student_first_class_date: p.students?.first_class_date,
        student_last_class_date: p.students?.last_class_date,
        student_status: p.students?.status,
        course_tuition_fee: p.courses?.tuition_fee,
      }));

      setPayments(paymentsWithDetails);
    } catch (error) {
      console.error('결제 조회 오류:', error);
      alert('결제 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    const filtered = getFilteredPayments();
    
    const stats: Statistics = {
      totalRevenue: 0,
      totalPayments: 0,
      totalRefunds: 0,
      confirmedPayments: 0,
      confirmedRefunds: 0,
      pendingPayments: 0,
      pendingRefunds: 0,
    };

    filtered.forEach(payment => {
      const amount = Math.abs(payment.amount);
      
      if (payment.type === 'payment') {
        stats.totalPayments += amount;
        if (payment.status === 'confirmed') {
          stats.confirmedPayments += amount;
        } else if (payment.status === 'pending') {
          stats.pendingPayments += amount;
        }
      } else if (payment.type === 'refund') {
        stats.totalRefunds += amount;
        if (payment.status === 'confirmed') {
          stats.confirmedRefunds += amount;
        } else if (payment.status === 'pending') {
          stats.pendingRefunds += amount;
        }
      }
    });

    stats.totalRevenue = stats.totalPayments - stats.totalRefunds;
    setStatistics(stats);
  };

  const getFilteredPayments = (): Payment[] => {
    let filtered = [...payments];

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.student_name?.toLowerCase().includes(term) ||
        p.course_name?.toLowerCase().includes(term)
      );
    }

    // 월 필터
    if (!showAllPeriod) {
      const [year, month] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getFullYear() === year &&
               paymentDate.getMonth() + 1 === month;
      });
    }

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    return filtered;
  };

  const handleSelectAll = () => {
    const filtered = getFilteredPayments();
    if (selectedPayments.size === filtered.length && filtered.length > 0) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filtered.map(p => p.id)));
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

  const handleBulkConfirm = async () => {
    if (selectedPayments.size === 0) return;
    
    if (!confirm(`선택한 ${selectedPayments.size}개의 항목을 확인 처리하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .in('id', Array.from(selectedPayments));

      if (error) throw error;

      // 로컬 상태 업데이트
      setPayments(prev => prev.map(p => 
        selectedPayments.has(p.id) ? { ...p, status: 'confirmed' } : p
      ));

      setSelectedPayments(new Set());
      alert('선택한 항목이 확인 처리되었습니다.');
    } catch (error) {
      console.error('일괄 확인 오류:', error);
      alert('확인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBulkPending = async () => {
    if (selectedPayments.size === 0) return;
    
    if (!confirm(`선택한 ${selectedPayments.size}개의 항목을 미납/미지급으로 변경하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'pending' })
        .in('id', Array.from(selectedPayments));

      if (error) throw error;

      // 로컬 상태 업데이트
      setPayments(prev => prev.map(p => 
        selectedPayments.has(p.id) ? { ...p, status: 'pending' } : p
      ));

      setSelectedPayments(new Set());
      alert('선택한 항목이 미납/미지급으로 변경되었습니다.');
    } catch (error) {
      console.error('일괄 미납 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const hasChanges = (paymentId: string): boolean => {
    const edits = editingPayments[paymentId];
    if (!edits || Object.keys(edits).length === 0) return false;

    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return false;

    if (edits.payment_method !== undefined && edits.payment_method !== payment.payment_method) return true;
    if (edits.payment_date !== undefined && edits.payment_date !== payment.payment_date) return true;
    if (edits.status !== undefined && edits.status !== payment.status) return true;

    return false;
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

      // 로컬 상태 업데이트
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, ...updateData } : p
      ));

      // 편집 상태 초기화
      setEditingPayments(prev => {
        const newState = { ...prev };
        delete newState[paymentId];
        return newState;
      });
    } catch (error) {
      console.error('결제 수정 오류:', error);
      alert('결제 수정 중 오류가 발생했습니다.');
    }
  };

  const filteredPayments = getFilteredPayments();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">수강료 관리</h1>
        <Link href="/">
          <Button variant="outline">홈으로</Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">총 매출액</h3>
          <p className="text-2xl font-bold text-blue-600">
            {statistics.totalRevenue.toLocaleString()}원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            결제 {statistics.totalPayments.toLocaleString()}원 - 환불 {statistics.totalRefunds.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">입금 확인액</h3>
          <p className="text-2xl font-bold text-green-600">
            {statistics.confirmedPayments.toLocaleString()}원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            환불 확인 {statistics.confirmedRefunds.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">미납액</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {statistics.pendingPayments.toLocaleString()}원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            미지급 환불 {statistics.pendingRefunds.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">월별 조회</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={showAllPeriod}
              className="w-40"
            />
          </div>
          <div className="flex items-center pt-6">
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
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">타입</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PaymentType)}
              className="flex h-10 w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="payment">수강료</option>
              <option value="refund">환불</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus)}
              className="flex h-10 w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="pending">미납/미지급</option>
              <option value="confirmed">확인됨</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700">검색</label>
            <Input
              placeholder="학생명 또는 수업명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>
        {selectedPayments.size > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Button
              size="sm"
              onClick={handleBulkConfirm}
            >
              선택한 {selectedPayments.size}개 확인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPending}
            >
              선택한 {selectedPayments.size}개 미납/미지급으로 변경
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

      {/* 결제 목록 */}
      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 결제가 없습니다.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
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
                <TableHead>타입</TableHead>
                <TableHead>학생명</TableHead>
                <TableHead>수업명</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>결제 방법</TableHead>
                <TableHead>결제일</TableHead>
                <TableHead>확인 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const isRefund = payment.type === 'refund';
                const displayAmount = isRefund ? -Math.abs(payment.amount) : payment.amount;
                
                return (
                  <TableRow 
                    key={payment.id}
                    className={isRefund ? 'bg-red-50' : ''}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isRefund ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isRefund ? '환불' : '수강료'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.student_name || '-'}
                    </TableCell>
                    <TableCell>{payment.course_name || '-'}</TableCell>
                    <TableCell className={`font-semibold ${isRefund ? 'text-red-600' : 'text-gray-900'}`}>
                      {displayAmount.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <select
                        value={editingPayments[payment.id]?.payment_method !== undefined
                          ? editingPayments[payment.id].payment_method!
                          : payment.payment_method}
                        onChange={(e) => {
                          setEditingPayments({
                            ...editingPayments,
                            [payment.id]: {
                              ...editingPayments[payment.id],
                              payment_method: e.target.value,
                            },
                          });
                        }}
                        onBlur={() => handleSavePayment(payment.id)}
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
                          : payment.payment_date}
                        onChange={(e) => {
                          setEditingPayments({
                            ...editingPayments,
                            [payment.id]: {
                              ...editingPayments[payment.id],
                              payment_date: e.target.value,
                            },
                          });
                        }}
                        onBlur={() => handleSavePayment(payment.id)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={editingPayments[payment.id]?.status !== undefined
                            ? editingPayments[payment.id].status!
                            : payment.status}
                          onChange={(e) => {
                            setEditingPayments({
                              ...editingPayments,
                              [payment.id]: {
                                ...editingPayments[payment.id],
                                status: e.target.value as 'pending' | 'confirmed',
                              },
                            });
                          }}
                          className="flex h-8 w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <option value="pending">{isRefund ? '미지급' : '미납'}</option>
                          <option value="confirmed">{isRefund ? '환불확인' : '입금확인'}</option>
                        </select>
                        {hasChanges(payment.id) && (
                          <Button
                            size="sm"
                            onClick={() => handleSavePayment(payment.id)}
                          >
                            확인
                          </Button>
                        )}
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
