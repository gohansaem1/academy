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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // 선택된 월의 시작일과 종료일 계산
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students(name),
          courses(name)
        `)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const paymentsWithNames = (data || []).map((payment: any) => ({
        ...payment,
        student_name: payment.students?.name,
        course_name: payment.courses?.name,
      }));

      setPayments(paymentsWithNames);
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

  const filteredPayments = payments
    .map(payment => ({
      ...payment,
      dueStatus: getPaymentDueStatus(payment),
    }))
    .filter(payment =>
      payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalAmount = filteredPayments
    .filter(p => p.status === 'completed' || p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">수강료 관리</h1>
      </div>

      <div className="mb-4 space-y-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              월별 조회
            </label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48"
            />
          </div>
          <Input
            placeholder="학생명 또는 수업명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <div className="text-lg font-semibold">
            총 수납액: {totalAmount.toLocaleString()}원
          </div>
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
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
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
                    <TableCell>{PAYMENT_METHODS[payment.payment_method]}</TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(payment.status === 'pending' || payment.status === 'completed') && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(payment.id)}
                          >
                            확인
                          </Button>
                        )}
                        {(payment.status === 'pending' || payment.status === 'completed') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(payment.id)}
                          >
                            취소
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

