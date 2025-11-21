import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollFix from "@/components/ScrollFix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "펀빌리티 영어미술",
  description: "학원의 학생, 강사, 수업, 수강료 등을 효율적으로 관리할 수 있는 웹 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        style={{ overflow: 'visible', paddingRight: '' }}
      >
        <ScrollFix />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
