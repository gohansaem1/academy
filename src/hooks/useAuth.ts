'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getCurrentUser } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';
import { User } from '@/types/user';

export function useAuth(requiredRole?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

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

      // 로그인하지 않은 경우
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // 역할 기반 접근 제어
      if (requiredRole && currentUser.role !== requiredRole) {
        alert('접근 권한이 없습니다.');
        router.push('/');
        return;
      }

      setHasAccess(true);
      setLoading(false);
    } catch (error) {
      console.error('인증 확인 오류:', error);
      router.push('/auth/login');
    }
  };

  return { user, loading, hasAccess };
}

