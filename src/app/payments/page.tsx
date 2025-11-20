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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students(name),
          courses(name)
        `)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const paymentsWithNames = (data || []).map((payment: any) => ({
        ...payment,
        student_name: payment.students?.name,
        course_name: payment.courses?.name,
      }));

      setPayments(paymentsWithNames);
    } catch (error) {
      console.error('결제 이력 조회 오류:', error);
      alert('결제 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

  const filteredPayments = payments.filter(payment =>
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
        <Link href="/payments/new">
          <Button>결제 등록</Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-4 items-end">
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
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
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
                    <span className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[payment.status]}`}>
                      {STATUS_LABELS[payment.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(payment.id)}
                        >
                          확인
                        </Button>
                      )}
                      {payment.status === 'completed' && (
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

