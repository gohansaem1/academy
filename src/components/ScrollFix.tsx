'use client';

import { useEffect } from 'react';

/**
 * body 요소의 overflow 스타일이 변경되어 스크롤이 막히는 것을 방지하는 컴포넌트
 */
export default function ScrollFix() {
  useEffect(() => {
    // body의 overflow와 padding-right 스타일을 유지
    const ensureScrollable = () => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
      if (document.body.style.paddingRight) {
        document.body.style.paddingRight = '';
      }
    };

    // 초기 실행
    ensureScrollable();

    // MutationObserver로 body 스타일 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          ensureScrollable();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // 주기적으로 확인 (백업)
    const interval = setInterval(ensureScrollable, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

