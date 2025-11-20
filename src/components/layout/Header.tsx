'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserFromStorage, signOut } from '@/lib/auth';
import { User } from '@/types/user';
import Button from '@/components/common/Button';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">학원 관리 시스템</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {user ? (
            <>
              <Link
                href="/students"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                학생 관리
              </Link>
              <Link
                href="/instructors"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                강사 관리
              </Link>
              <Link
                href="/courses"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                수업 관리
              </Link>
              <Link
                href="/attendance"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                출석 관리
              </Link>
              <Link
                href="/attendance/statistics"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                출석 통계
              </Link>
              <Link
                href="/payments"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                수강료 관리
              </Link>
              <Link
                href="/learning-logs/new"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                학습일지 작성
              </Link>
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
