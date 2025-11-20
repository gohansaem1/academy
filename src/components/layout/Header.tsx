'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserFromStorage, signOut } from '@/lib/auth';
import { ROLE_MENUS } from '@/lib/permissions';
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'TEACHER':
        return '강사';
      case 'STUDENT':
        return '학생';
      case 'PARENT':
        return '학부모';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">펀빌리티 영어미술</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {user ? (
            <>
              {ROLE_MENUS[user.role].map((menu) => (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {menu.label}
                </Link>
              ))}
              <div className="flex items-center gap-4 ml-auto">
                {user.role === 'ADMIN' ? (
                  <Link
                    href="/admin/settings"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {user.name} ({getRoleLabel(user.role)})
                  </Link>
                ) : (
                  <span className="text-sm text-gray-600">
                    {user.name} ({getRoleLabel(user.role)})
                  </span>
                )}
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
