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

    // 비밀번호가 0000인 경우 로그인 시도 없이 바로 비밀번호 변경 페이지로 이동
    if (formData.password === '0000') {
      // 사용자 정보 확인
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (userData && userData.role === 'ADMIN') {
          // 사용자 정보 저장
          localStorage.setItem('temp_user', JSON.stringify(userData));
          // 이메일 기억하기 처리
          if (rememberEmail) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
          // 강제로 비밀번호 변경 페이지로 이동
          window.location.href = '/admin/settings?initial=true&email=' + encodeURIComponent(formData.email);
          return;
        } else {
          setError('관리자 계정이 아닙니다.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('사용자 정보 조회 오류:', err);
        setError('사용자 정보를 확인할 수 없습니다.');
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        // 비밀번호 노출 경고인 경우 특별 처리
        if (authError.message?.includes('password') || authError.message?.includes('exposed') || authError.message?.includes('compromised')) {
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
                // 임시로 사용자 정보 저장하고 비밀번호 변경 페이지로 강제 이동
                localStorage.setItem('temp_user', JSON.stringify(userData));
                // window.location.href를 사용하여 강제 리다이렉트
                window.location.href = '/admin/settings?initial=true&email=' + encodeURIComponent(formData.email);
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
        console.log('✅ 로그인 성공:', {
          userId: data.user.id,
          email: data.user.email,
        });

        // 사용자 정보 조회
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('사용자 정보 조회 오류:', userError);
          console.error('Auth User ID:', data.user.id);
          console.error('Auth User Email:', data.user.email);
          
          // users 테이블에 사용자가 없는 경우, 이메일로 재시도
          if (userError.code === 'PGRST116') {
            const { data: userDataByEmail, error: emailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', formData.email)
              .single();
            
            if (emailError || !userDataByEmail) {
              setError(`사용자 정보를 찾을 수 없습니다. users 테이블에 관리자 계정이 있는지 확인해주세요. (Auth ID: ${data.user.id})`);
              setLoading(false);
              return;
            }
            
            // ID 불일치 문제 해결: users 테이블의 ID를 auth.users의 ID로 업데이트
            const { error: updateError } = await supabase
              .from('users')
              .update({ id: data.user.id })
              .eq('email', formData.email);
            
            if (updateError) {
              console.error('ID 업데이트 오류:', updateError);
              setError('사용자 정보를 업데이트할 수 없습니다. 관리자에게 문의하세요.');
              setLoading(false);
              return;
            }
            
            // 업데이트된 사용자 정보 다시 조회
            const { data: updatedUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            if (updatedUserData) {
              localStorage.setItem('user', JSON.stringify(updatedUserData));
              console.log('✅ 사용자 정보 저장 완료:', updatedUserData);
            } else {
              setError('사용자 정보를 저장할 수 없습니다.');
              setLoading(false);
              return;
            }
          } else {
            setError(`사용자 정보 조회 실패: ${userError.message}`);
            setLoading(false);
            return;
          }
        } else if (!userData) {
          setError('사용자 정보를 찾을 수 없습니다. users 테이블에 관리자 계정이 있는지 확인해주세요.');
          setLoading(false);
          return;
        } else {
          // 세션 저장 (localStorage)
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ 사용자 정보 저장 완료:', userData);
        }

        // 이메일 기억하기 처리
        if (rememberEmail) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        // 로그인 성공 - 홈으로 강제 이동
        console.log('✅ 홈 페이지로 이동합니다...');
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      // 비밀번호 노출 경고 메시지 처리
      if (error.message?.includes('password') || error.message?.includes('exposed') || error.message?.includes('compromised')) {
        setError('보안을 위해 비밀번호를 변경해주세요. 비밀번호 변경 페이지로 이동합니다.');
        // 잠시 후 비밀번호 변경 페이지로 강제 이동
        setTimeout(() => {
          window.location.href = '/admin/settings?initial=true&email=' + encodeURIComponent(formData.email);
        }, 1500);
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

