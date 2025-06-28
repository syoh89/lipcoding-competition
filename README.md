# Mentor-Mentee Matching Application

멘토와 멘티를 서로 매칭하는 웹 애플리케이션입니다.

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- SQLite
- JWT Authentication
- Swagger UI
- Multer (파일 업로드)

## 주요 기능

- 사용자 회원가입/로그인 (멘토/멘티 역할 선택)
- 프로필 관리 (이미지 업로드 포함)
- 멘토 목록 조회 및 필터링
- 매칭 요청 시스템
- 요청 상태 관리 (대기/수락/거절/취소)
- JWT 기반 인증
- OpenAPI 3.0 스펙 준수

## 설치 및 실행

### 전체 의존성 설치
```bash
npm run install:all
```

### 개발 모드 실행 (프론트엔드 + 백엔드 동시 실행)
```bash
npm run dev
```

### 개별 실행
```bash
# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend
```

## 접속 URL

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8088/api
- **Swagger UI**: http://localhost:8088/swagger-ui

## API 명세

이 애플리케이션은 [OpenAPI 3.0 스펙](./openapi.yaml)을 따릅니다.

### 주요 엔드포인트

- `POST /api/signup` - 회원가입
- `POST /api/login` - 로그인
- `GET /api/me` - 현재 사용자 정보
- `PUT /api/profile` - 프로필 수정
- `GET /api/mentors` - 멘토 목록 조회
- `POST /api/match-requests` - 매칭 요청
- `GET /api/match-requests/incoming` - 받은 요청 목록 (멘토용)
- `GET /api/match-requests/outgoing` - 보낸 요청 목록 (멘티용)

## 프로젝트 구조

```
mento-menti/
├── frontend/          # React 프론트엔드
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express 백엔드
│   ├── src/
│   ├── uploads/       # 프로필 이미지 저장
│   └── package.json
├── openapi.yaml       # API 명세서
└── package.json       # 루트 패키지 설정
```

## 보안 기능

- JWT 토큰 기반 인증
- SQL 인젝션 방지
- XSS 공격 방지
- 파일 업로드 검증
- CORS 설정

## 개발 가이드

1. **데이터베이스**: SQLite를 사용하여 로컬 개발이 용이합니다.
2. **인증**: JWT 토큰은 1시간 유효기간을 가집니다.
3. **이미지 업로드**: .jpg, .png 형식만 허용, 최대 1MB, 500x500~1000x1000 픽셀
4. **역할 기반 접근**: 멘토와 멘티에 따라 다른 기능 제공
