# QUAD Decisive Signals

> 한국 주식 시장 실시간 매매 시그널 플랫폼

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | QUAD Decisive Signals |
| **목적** | 한국 주식(KOSPI/KOSDAQ) 실시간 매매 시그널 제공 및 뉴스 기반 종목 추천 |
| **플랫폼** | Cloudflare Pages + Workers (Edge Runtime) |
| **기술 스택** | Hono (TypeScript) · Cloudflare D1 · TailwindCSS · Chart.js |

---

## 🌐 서비스 URL

| 환경 | URL |
|------|-----|
| **Production** | https://quadsignals.pages.dev |
| **GitHub** | https://github.com/kesikten123/quadsignals |

---

## ✅ 구현된 기능

### 인증 시스템
- JWT 기반 로그인 / 회원가입
- 관리자 승인 후 서비스 이용 가능 (pending → approved)
- 비밀번호 변경 (현재 비밀번호 검증 + 세션 전체 무효화)
- 자동 로그아웃 및 토큰 검증

### 사용자 기능
- **대시보드** – 주요 지수(KOSPI/KOSDAQ), 매매 시그널 요약, 종목 추천 TOP 5
- **주가 시그널** – BUY/SELL/HOLD 시그널 목록, 강도 표시
- **KOSPI / KOSDAQ** – 시장별 종목 현황 및 차트
- **뉴스 & 종목 추천** – Google News RSS 실시간 뉴스, 카테고리 필터, 관련 종목 자동 추천
  - 뉴스 발행 시간 (방금 전 / N분 전 / N시간 전 / N일 전) 표시
  - 카테고리: 전체 / KOSPI / KOSDAQ / 바이오 / 반도체 / 2차전지 / 로봇
  - 뉴스 키워드 기반 관련 종목 자동 추천 (100+ 종목 매핑)
- **계정 설정** – 내 정보 확인, 비밀번호 변경 (강도 게이지 + 실시간 일치 확인)

### 관리자 기능
- **관리 대시보드** – 전체 사용자/승인 대기/시그널 통계
- **승인 대기** – 회원가입 신청자 인적 정보 확인 및 승인/거부
- **전체 회원** – 회원 검색/필터, 상세 모달, 승인·거부·재승인·삭제
- **시그널 관리** – 매매 시그널 추가/삭제
- **관리자 설정** – 관리자 비밀번호 변경, 보안 안내

### UI / UX
- 다크 테마 전용 디자인 (오렌지 브랜드 컬러)
- 완전한 모바일 반응형 (하단 탭바, 1열 카드 레이아웃)
- 실시간 티커 테이프 (상단 주가 흐름 표시)
- 브랜드 로고 클릭 시 홈(대시보드)으로 이동

---

## 🗄️ 데이터 아키텍처

### 데이터 모델

| 테이블 | 주요 컬럼 | 설명 |
|--------|----------|------|
| `users` | id, username, password_hash, name, phone, email, role, status | 사용자 계정 (role: user/admin, status: pending/approved/rejected) |
| `sessions` | id, user_id, expires_at | JWT 세션 관리 |
| `signals` | id, stock_code, stock_name, market, signal_type, price, target_price, stop_loss, strength, description | 매매 시그널 |

### 스토리지 서비스

| 서비스 | 용도 |
|--------|------|
| **Cloudflare D1** | 사용자·세션·시그널 데이터 (SQLite) |

### 외부 API

| API | 용도 |
|-----|------|
| Google News RSS | 한국 주식 실시간 뉴스 수집 |
| 네이버 뉴스 API | (선택적) 활성화 시 자동 우선 사용 |

---

## 👤 사용 가이드

### 일반 사용자
1. https://quadsignals.pages.dev 접속
2. 회원가입 → 관리자 승인 대기
3. 승인 후 로그인 → 대시보드 이용
4. 사이드바 **계정 설정**에서 비밀번호 변경 가능

### 관리자 (초기 계정)
- ID: `admin` / PW: `Admin1234!`
- 로그인 후 관리자 패널 자동 접속
- **관리자 설정**에서 비밀번호 변경 가능

---

## 🚀 개발 환경 실행

```bash
# 의존성 설치
npm install

# 로컬 D1 마이그레이션
npm run db:migrate:local

# 로컬 서버 실행 (PM2)
npm run build
pm2 start ecosystem.config.cjs
```

## 📦 배포

```bash
# Cloudflare Pages 배포
npm run build
npx wrangler pages deploy dist --project-name quadsignals

# 프로덕션 DB 마이그레이션
npm run db:migrate:prod
```

---

## 🔧 배포 현황

| 항목 | 내용 |
|------|------|
| **플랫폼** | Cloudflare Pages |
| **상태** | ✅ 운영 중 |
| **최종 업데이트** | 2026-04-05 |
| **빌드 크기** | ~95 kB (SSR Worker) |
| **D1 Database** | quadsignals-production |
