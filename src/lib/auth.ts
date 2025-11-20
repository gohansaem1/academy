import { supabase } from './supabase/client';
import { User } from '@/types/user';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }

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

