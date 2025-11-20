'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitial = searchParams.get('initial') === 'true';
  const emailParam = searchParams.get('email');
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: emailParam || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 임시 저장된 사용자 정보 확인
    const tempUser = localStorage.getItem('temp_user');
    if (tempUser) {
      try {
        const userData = JSON.parse(tempUser);
        setUser(userData);
        setFormData(prev => ({ ...prev, email: userData.email || emailParam || '' }));
        localStorage.removeItem('temp_user');
      } catch (err) {
        console.error('임시 사용자 정보 파싱 오류:', err);
      }
    } else {
      // 일반적인 경우 useAuth 사용
      const { getUserFromStorage, getCurrentUser } = require('@/lib/auth');
      const checkAuth = async () => {
        try {
          let currentUser = getUserFromStorage();
          if (!currentUser) {
            currentUser = await getCurrentUser();
            if (currentUser) {
              localStorage.setItem('user', JSON.stringify(currentUser));
            }
          }
          setUser(currentUser);
          if (currentUser) {
            setFormData(prev => ({ ...prev, email: currentUser.email || '' }));
          }
        } catch (err) {
          console.error('인증 확인 오류:', err);
        } finally {
          setAuthLoading(false);
        }
      };
      checkAuth();
    }

    // 초기 비밀번호 변경인 경우 현재 비밀번호 필드에 기본값 설정
    if (isInitial) {
      setFormData(prev => ({ ...prev, currentPassword: '0000' }));
      setAuthLoading(false);
    }
  }, [isInitial, emailParam]);

  if (authLoading && !isInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 유효성 검사
    if (formData.newPassword.length < 8) {
      setError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 복잡도 검사
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError('비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('현재 비밀번호와 새 비밀번호가 같습니다.');
      return;
    }

    try {
      setLoading(true);

      const email = formData.email || user?.email;
      if (!email) {
        setError('이메일 정보가 없습니다. 다시 로그인해주세요.');
        router.push('/auth/login');
        return;
      }

      // 초기 비밀번호 변경인 경우, 먼저 로그인 시도
      if (isInitial && formData.currentPassword === '0000') {
        // 초기 비밀번호로 로그인 시도 (Supabase가 차단할 수 있음)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: '0000',
        });

        // 로그인 실패해도 비밀번호 변경은 시도
        if (signInError && !signInError.message?.includes('password') && !signInError.message?.includes('exposed')) {
          setError('현재 비밀번호가 올바르지 않습니다.');
          return;
        }
      } else {
        // 일반적인 경우 현재 비밀번호 확인
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: formData.currentPassword,
        });

        if (signInError) {
          setError('현재 비밀번호가 올바르지 않습니다.');
          return;
        }
      }

      // 비밀번호 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // 사용자 정보 다시 조회하여 세션 업데이트
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', updatedUser.id)
          .single();
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      setSuccess(true);
      setFormData({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // 2초 후 홈으로 리다이렉트
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error);
      setError(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold mb-6">비밀번호 변경</h1>

      {isInitial && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="font-semibold">⚠️ 비밀번호 변경이 필요합니다</p>
          <p className="text-sm mt-1">보안을 위해 비밀번호를 변경해주세요. 현재 비밀번호는 0000입니다.</p>
        </div>
      )}

      {!user && isInitial && (
        <div className="mb-4">
          <Input
            label="이메일"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading || success}
            placeholder="로그인에 사용한 이메일을 입력하세요"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            비밀번호가 성공적으로 변경되었습니다. 홈으로 이동합니다...
          </div>
        )}

        <Input
          label="현재 비밀번호"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          required
          autoComplete="current-password"
          disabled={loading || success || isInitial}
          placeholder={isInitial ? '0000 (초기 비밀번호)' : ''}
        />

        <Input
          label="새 비밀번호"
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          required
          minLength={6}
          autoComplete="new-password"
          disabled={loading || success}
          helperText="최소 8자 이상, 대문자/소문자/숫자/특수문자 포함"
        />

        <Input
          label="새 비밀번호 확인"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          minLength={6}
          autoComplete="new-password"
          disabled={loading || success}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || success}
            className="flex-1"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading || success}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ChangePasswordContent />
    </Suspense>
  );
}

