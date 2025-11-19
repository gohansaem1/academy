import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">학원 관리 시스템</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
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
            href="/payments"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            수강료 관리
          </Link>
        </nav>
      </div>
    </header>
  );
}

