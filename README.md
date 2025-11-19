# 학원 관리 시스템 (Academy Management System)

학원의 학생, 강사, 수업, 수강료 등을 효율적으로 관리할 수 있는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

이 프로젝트는 학원 운영에 필요한 핵심 기능들을 제공하는 통합 관리 시스템입니다. 학생 등록, 강사 관리, 수업 스케줄링, 출석 관리, 수강료 결제 등의 기능을 포함합니다.

## 🚀 기술 스택

- **프레임워크**: Next.js 16.0.3
- **언어**: TypeScript 5
- **UI 라이브러리**: React 19.2.0
- **스타일링**: Tailwind CSS 4
- **데이터베이스**: Supabase (PostgreSQL)
- **패키지 관리**: npm

## 📁 프로젝트 구조

```
academy/
├── src/
│   └── app/              # Next.js App Router
│       ├── layout.tsx    # 루트 레이아웃
│       ├── page.tsx      # 홈 페이지
│       └── globals.css   # 전역 스타일
├── public/               # 정적 파일
├── docs/                 # 개발 문서
│   ├── DEVELOPMENT.md   # 개발 계획서
│   ├── ARCHITECTURE.md  # 아키텍처 설계
│   └── API.md           # API 명세서
├── package.json
└── README.md
```

## 🛠️ 설치 및 실행

### 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://krcncyrwiirgfvzsqpjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **참고**: `.env.local` 파일은 Git에 커밋되지 않습니다. 실제 Supabase API 키를 사용하세요.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 📚 주요 기능

### 1. 학생 관리
- 학생 등록 및 정보 수정
- 학생 목록 조회 및 검색
- 학생별 수강 이력 관리

### 2. 강사 관리
- 강사 등록 및 정보 관리
- 강사별 담당 수업 관리

### 3. 수업 관리
- 수업 등록 및 스케줄 관리
- 수업별 학생 등록
- 수업 시간표 관리

### 4. 출석 관리
- 출석 체크 및 기록
- 출석 통계 조회

### 5. 수강료 관리
- 수강료 결제 처리
- 결제 이력 조회
- 미납 관리

## 📖 문서

자세한 개발 문서는 `docs/` 디렉토리를 참고하세요:

- [개발 계획서](./docs/DEVELOPMENT.md)
- [아키텍처 설계](./docs/ARCHITECTURE.md)
- [API 명세서](./docs/API.md)
- [데이터베이스 설계](./docs/DATABASE.md)

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.
