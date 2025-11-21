'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Link from 'next/link';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitial = searchParams.get('initial') === 'true';
  const emailParam = searchParams.get('email');
  
  const { user, loading: authLoading } = useAuth('ADMIN');
  const [formData, setFormData] = useState({
    email: emailParam || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setFormData(prev => ({ ...prev, email: user.email || emailParam || '' }));
    }
  }, [authLoading, user, emailParam]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.';
    }
    if (!/[A-Z]/.test(password)) {
      return '비밀번호에 대문자가 포함되어야 합니다.';
    }
    if (!/[a-z]/.test(password)) {
      return '비밀번호에 소문자가 포함되어야 합니다.';
    }
    if (!/[0-9]/.test(password)) {
      return '비밀번호에 숫자가 포함되어야 합니다.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return '비밀번호에 특수문자가 포함되어야 합니다.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 비밀번호 일치 확인
    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 유효성 검사
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setSaving(true);

      // 초기 비밀번호 변경인 경우 (비밀번호가 0000인 경우)
      if (isInitial) {
        // 임시 저장된 사용자 정보 확인
        const tempUserStr = localStorage.getItem('temp_user');
        let userData = null;
        
        if (tempUserStr) {
          try {
            userData = JSON.parse(tempUserStr);
          } catch (err) {
            console.error('임시 사용자 정보 파싱 오류:', err);
          }
        }
        
        // 사용자 정보가 없으면 이메일로 조회
        if (!userData && formData.email) {
          const { data: fetchedUserData } = await supabase
            .from('users')
            .select('*')
            .eq('email', formData.email)
            .single();
          
          if (fetchedUserData) {
            userData = fetchedUserData;
          }
        }
        
        if (!userData) {
          setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
          return;
        }
        
        // 현재 세션 확인
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // 세션이 없으면 강제로 로그인 시도 (에러 무시)
        if (!currentUser) {
          // 로그인 시도 (에러는 무시하고 진행)
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: '0000',
          }).catch(() => {
            // 에러 무시 - 크롬 경고가 나와도 계속 진행
          });
        }
        
        // 비밀번호 변경 시도
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (updateError) {
          // 업데이트 실패 시, 다시 로그인 시도 후 재시도
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: '0000',
          }).catch(() => {
            // 에러 무시
          });
          
          // 다시 비밀번호 변경 시도
          const { error: retryError } = await supabase.auth.updateUser({
            password: formData.newPassword,
          });
          
          if (retryError) {
            setError('비밀번호 변경에 실패했습니다. Supabase Dashboard에서 직접 변경해주세요.');
            return;
          }
        }

        // 사용자 정보 다시 조회하여 세션 업데이트
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        if (updatedUser) {
          const { data: refreshedUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', updatedUser.id)
            .single();
          
          if (refreshedUserData) {
            localStorage.setItem('user', JSON.stringify(refreshedUserData));
          }
        } else {
          // 세션이 없어도 사용자 정보 저장
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // 임시 사용자 정보 삭제
        localStorage.removeItem('temp_user');

        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // 일반 비밀번호 변경인 경우
      if (!formData.currentPassword) {
        setError('현재 비밀번호를 입력해주세요.');
        return;
      }

      // 현재 비밀번호 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        setError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }

      // 새 비밀번호로 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setFormData({
        email: formData.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('비밀번호 변경 오류:', err);
      setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">설정</h1>
        <p className="text-gray-600">계정 설정 및 시스템 관리</p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">비밀번호 변경</h2>
        
        {isInitial && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              초기 비밀번호를 변경해주세요. 보안을 위해 강력한 비밀번호를 사용하세요.
            </p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              비밀번호가 성공적으로 변경되었습니다.
              {isInitial && ' 잠시 후 홈 화면으로 이동합니다.'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
            required
          />

          {!isInitial && (
            <Input
              label="현재 비밀번호"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
          )}

          <Input
            label="새 비밀번호"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500">
            비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.
          </p>

          <Input
            label="새 비밀번호 확인"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? '변경 중...' : '비밀번호 변경'}
            </Button>
            {!isInitial && (
              <Link href="/admin/dashboard">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">계정 정보</h2>
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-500">이름</label>
            <p className="text-lg mt-1">{user?.name || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">역할</label>
            <p className="text-lg mt-1">관리자</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">이메일</label>
            <p className="text-lg mt-1">{user?.email || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

