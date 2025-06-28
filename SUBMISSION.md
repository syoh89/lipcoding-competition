# 멘토-멘티 매칭 애플리케이션 제출

## 프로젝트 개요
천하제일 입코딩 대회 2025를 위한 멘토-멘티 매칭 웹 애플리케이션입니다.

## 주요 구현 기능

### ✅ 필수 기능
- [x] 사용자 회원가입/로그인 (멘토/멘티 역할 선택)
- [x] JWT 기반 인증 시스템
- [x] 프로필 관리 (이미지 업로드 포함)
- [x] 멘토 목록 조회 및 필터링
- [x] 매칭 요청 시스템 (신청/수락/거절/취소)
- [x] 대시보드 및 요청 관리
- [x] OpenAPI 3.0 스펙 준수
- [x] Swagger UI 문서

### ✅ 기술 스택
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + SQLite
- **Authentication**: JWT
- **Documentation**: Swagger UI + OpenAPI 3.0

## 실행 방법

```bash
# 전체 의존성 설치
npm run install:all

# 개발 서버 실행 (프론트엔드 + 백엔드)
npm run dev
```

## 접속 URL
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8088/api
- **Swagger UI**: http://localhost:8088/swagger-ui

## 테스트 결과
- ✅ 프론트엔드/백엔드 정상 기동
- ✅ API 연동 확인
- ✅ 회원가입/로그인 기능 테스트 통과
- ✅ 매칭 시스템 정상 작동
- ✅ Swagger UI 문서 제공

## 프로젝트 구조
```
mento-menti/
├── frontend/          # React 프론트엔드
├── backend/           # Express 백엔드
├── openapi.yaml       # API 명세서
└── README.md          # 상세 가이드
```

## 제출 시각
2025년 6월 28일

## 개발자
- GitHub ID: [사용자 GitHub ID]
- 프로젝트 저장소: [저장소 주소]
