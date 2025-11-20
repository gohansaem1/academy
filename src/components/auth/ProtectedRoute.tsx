'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserFromStorage, getCurrentUser } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';
import { User } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      // localStorage에서 먼저 확인
      let currentUser = getUserFromStorage();
      
      // 없으면 서버에서 확인
      if (!currentUser) {
        currentUser = await getCurrentUser();
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }

      setUser(currentUser);

      // 로그인 페이지나 회원가입 페이지는 통과
      if (pathname === '/auth/login' || pathname === '/auth/register') {
        setLoading(false);
        return;
      }

      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // 역할 기반 접근 제어
      if (requiredRole && currentUser.role !== requiredRole) {
        router.push('/');
        return;
      }

      // 경로 접근 권한 확인
      if (!canAccessRoute(currentUser, pathname)) {
        router.push('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('인증 확인 오류:', error);
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

