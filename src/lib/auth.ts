import { supabase } from './supabase/client';
import { User } from '@/types/user';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth 세션 확인 오류:', authError);
      return null;
    }
    
    if (!user) {
      console.log('Auth 세션이 없습니다.');
      return null;
    }

    console.log('Auth 세션 확인:', { userId: user.id, email: user.email });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      // 이메일로 재시도
      const { data: userDataByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (userDataByEmail) {
        console.log('이메일로 사용자 정보 조회 성공:', userDataByEmail);
        return userDataByEmail;
      }
      
      return null;
    }

    console.log('사용자 정보 조회 성공:', data);
    return data;
  } catch (error) {
    console.error('사용자 인증 확인 오류:', error);
    return null;
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  } catch (error) {
    console.error('로그아웃 오류:', error);
  }
}

export function getUserFromStorage(): User | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('저장된 사용자 정보 읽기 오류:', error);
    return null;
  }
}

