'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 저장된 이메일 불러오기
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        // 비밀번호 노출 경고인 경우 특별 처리
        if (authError.message?.includes('password') || authError.message?.includes('exposed')) {
          // 초기 비밀번호인 경우 비밀번호 변경 페이지로 이동
          if (formData.password === '0000') {
            // 사용자 정보를 먼저 확인
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', formData.email)
                .single();

              if (userData) {
                // 임시로 사용자 정보 저장하고 비밀번호 변경 페이지로 이동
                localStorage.setItem('temp_user', JSON.stringify(userData));
                router.push('/profile/change-password?initial=true&email=' + encodeURIComponent(formData.email));
                return;
              }
            } catch (err) {
              console.error('사용자 정보 조회 오류:', err);
            }
          }
        }
        throw authError;
      }

      if (data.user) {
        // 사용자 정보 조회
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('사용자 정보 조회 오류:', userError);
        }

        // 세션 저장 (localStorage)
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // 이메일 기억하기 처리
        if (rememberEmail) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        // 초기 비밀번호(0000)인 경우 비밀번호 변경 페이지로 리다이렉트
        if (formData.password === '0000' && userData?.role === 'ADMIN') {
          router.push('/profile/change-password?initial=true');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      // 비밀번호 노출 경고 메시지 처리
      if (error.message?.includes('password') || error.message?.includes('exposed')) {
        setError('보안을 위해 비밀번호를 변경해주세요. 비밀번호 변경 페이지로 이동합니다.');
        // 잠시 후 비밀번호 변경 페이지로 이동
        setTimeout(() => {
          router.push('/profile/change-password?initial=true&email=' + encodeURIComponent(formData.email));
        }, 2000);
      } else {
        setError(error.message || '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold mb-6 text-center">로그인</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="이메일"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          autoComplete="email"
        />

        <Input
          label="비밀번호"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-email"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-email" className="ml-2 block text-sm text-gray-700">
            이메일 기억하기
          </label>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '로그인 중...' : '로그인'}
        </Button>

        <div className="text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </div>
      </form>
    </div>
  );
}

