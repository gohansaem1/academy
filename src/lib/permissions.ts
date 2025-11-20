import { User } from '@/types/user';

export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

// 역할별 접근 가능한 경로 정의
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  ADMIN: [
    '/',
    '/students',
    '/students/new',
    '/instructors',
    '/instructors/new',
    '/courses',
    '/courses/new',
    '/attendance',
    '/attendance/new',
    '/payments',
    '/learning-logs',
    '/learning-logs/new',
  ],
  TEACHER: [
    '/',
    '/courses',
    '/attendance',
    '/attendance/new',
    '/learning-logs',
    '/learning-logs/new',
  ],
  STUDENT: [
    '/',
    '/courses',
    '/attendance',
    '/learning-logs',
  ],
  PARENT: [
    '/',
    '/courses',
    '/attendance',
    '/learning-logs',
    '/payments',
  ],
};

// 역할별 메뉴 항목
export const ROLE_MENUS: Record<UserRole, Array<{ href: string; label: string }>> = {
  ADMIN: [
    { href: '/admin/dashboard', label: '대시보드' },
    { href: '/students', label: '학생 관리' },
    { href: '/instructors', label: '강사 관리' },
    { href: '/courses', label: '수업 관리' },
    { href: '/attendance/new', label: '출석 체크' },
    { href: '/payments', label: '수강료 관리' },
    { href: '/learning-logs', label: '학습일지' },
  ],
  TEACHER: [
    { href: '/courses', label: '수업 관리' },
    { href: '/attendance/new', label: '출석 체크' },
    { href: '/learning-logs', label: '학습일지' },
  ],
  STUDENT: [
    { href: '/courses', label: '수업 목록' },
    { href: '/attendance', label: '출석 확인' },
    { href: '/learning-logs', label: '학습일지' },
  ],
  PARENT: [
    { href: '/courses', label: '수업 목록' },
    { href: '/attendance', label: '출석 확인' },
    { href: '/learning-logs', label: '학습일지' },
    { href: '/payments', label: '수강료 확인' },
  ],
};

// 경로 접근 권한 확인
export function canAccessRoute(user: User | null, pathname: string): boolean {
  if (!user) {
    // 로그인하지 않은 사용자는 로그인 페이지와 홈페이지만 접근 가능
    return pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/';
  }

  // 관리자는 모든 경로에 접근 가능 (인증 페이지 제외)
  if (user.role === 'ADMIN') {
    return !pathname.startsWith('/auth/');
  }

  const allowedRoutes = ROLE_ROUTES[user.role];
  return allowedRoutes.some(route => {
    // 정확한 경로 매칭 또는 하위 경로 매칭
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

// 역할 확인 헬퍼 함수들
export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

export function isTeacher(user: User | null): boolean {
  return user?.role === 'TEACHER';
}

export function isStudent(user: User | null): boolean {
  return user?.role === 'STUDENT';
}

export function isParent(user: User | null): boolean {
  return user?.role === 'PARENT';
}

export function isAdminOrTeacher(user: User | null): boolean {
  return isAdmin(user) || isTeacher(user);
}

