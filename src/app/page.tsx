'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getCurrentUser } from '@/lib/auth';
import { User } from '@/types/user';
import Link from 'next/link';
import Button from '@/components/common/Button';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      if (!currentUser) {
        router.push('/auth/login');
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

  if (!user) {
    return null; // 리다이렉트 중
  }

  // 역할별 대시보드
  const getRoleDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/students" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">학생 관리</h3>
              <p className="text-gray-600">학생 정보를 등록하고 관리합니다.</p>
            </Link>
            <Link href="/instructors" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">강사 관리</h3>
              <p className="text-gray-600">강사 정보를 등록하고 관리합니다.</p>
            </Link>
            <Link href="/courses" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수업 관리</h3>
              <p className="text-gray-600">수업을 개설하고 관리합니다.</p>
            </Link>
            <Link href="/attendance" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 관리</h3>
              <p className="text-gray-600">학생 출석을 확인하고 관리합니다.</p>
            </Link>
            <Link href="/payments" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수강료 관리</h3>
              <p className="text-gray-600">수강료 입금을 확인하고 관리합니다.</p>
            </Link>
            <Link href="/attendance/statistics" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 통계</h3>
              <p className="text-gray-600">출석 통계를 확인합니다.</p>
            </Link>
          </div>
        );
      case 'TEACHER':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/courses" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수업 관리</h3>
              <p className="text-gray-600">담당 수업을 확인하고 관리합니다.</p>
            </Link>
            <Link href="/attendance" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 관리</h3>
              <p className="text-gray-600">학생 출석을 확인하고 체크합니다.</p>
            </Link>
            <Link href="/learning-logs/new" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">학습일지 작성</h3>
              <p className="text-gray-600">수업 학습일지를 작성합니다.</p>
            </Link>
            <Link href="/attendance/statistics" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 통계</h3>
              <p className="text-gray-600">출석 통계를 확인합니다.</p>
            </Link>
          </div>
        );
      case 'STUDENT':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/courses" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수업 목록</h3>
              <p className="text-gray-600">등록한 수업을 확인합니다.</p>
            </Link>
            <Link href="/attendance" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 확인</h3>
              <p className="text-gray-600">내 출석 기록을 확인합니다.</p>
            </Link>
            <Link href="/learning-logs" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">학습일지</h3>
              <p className="text-gray-600">수업 학습일지를 확인합니다.</p>
            </Link>
          </div>
        );
      case 'PARENT':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/courses" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수업 목록</h3>
              <p className="text-gray-600">자녀의 수업을 확인합니다.</p>
            </Link>
            <Link href="/attendance" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">출석 확인</h3>
              <p className="text-gray-600">자녀의 출석 기록을 확인합니다.</p>
            </Link>
            <Link href="/learning-logs" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">학습일지</h3>
              <p className="text-gray-600">자녀의 학습일지를 확인합니다.</p>
            </Link>
            <Link href="/payments" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">수강료 확인</h3>
              <p className="text-gray-600">수강료 납부 내역을 확인합니다.</p>
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          환영합니다, {user.name}님!
        </h1>
        <p className="text-gray-600">
          역할: {user.role === 'ADMIN' ? '관리자' : user.role === 'TEACHER' ? '강사' : user.role === 'STUDENT' ? '학생' : '학부모'}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">주요 기능</h2>
        {getRoleDashboard()}
      </div>
    </div>
  );
}
