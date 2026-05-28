# Server Integration Review

작성 기준일: 2026-05-27

## 이번 수정에 반영한 내용

- JSON body 파서가 모니터링 라우트보다 먼저 실행되도록 순서를 수정했다.
- 요청 body를 서버 로그에 출력하지 않도록 하여 로그인 비밀번호 등 민감 정보 노출을 줄였다.
- DB 접속 정보 하드코딩을 제거하고 `server/.env` 환경 변수를 사용하도록 변경했다.
- 로그인 쿼리가 필요한 컬럼만 조회하도록 바꾸고, 사용자 row 전체 로그 출력을 제거했다.
- 사용자 조회는 JWT 사용자와 URL 사용자 ID가 같은 경우에만 허용한다.
- 모니터링 및 히스토리 라우트에 JWT 인증을 적용했다.
- 히스토리 조회 기준을 query의 `userIdx`가 아닌 JWT 사용자로 고정했다.
- 세션 생성 시 `userIdx`, 최신 `profileIdx`, `alarmCondition`을 서버가 결정하도록 변경했다.
- 세션 이벤트 저장과 종료는 세션 소유자만 수행할 수 있도록 제한했다.
- 세션 종료 시간 저장과 수면 리포트 생성을 DB 트랜잭션으로 묶었다.
- Swagger에 모니터링, 히스토리, AI 요청 경로와 Bearer 인증 정보를 추가했다.

## 서버 API 계약

API 기본 URL 예시:

```text
http://localhost:3000/api
```

인증이 필요한 요청은 로그인 응답의 token을 헤더에 포함한다.

```http
Authorization: Bearer <accessToken>
```

| 기능 | Method | Path | 요청 body | 인증 |
| --- | --- | --- | --- | --- |
| 로그인 | POST | `/auth/login` | `loginId`, `password` | 불필요 |
| AI 예측 | POST | `/ai/predict` | multipart `audio` | 현재 불필요 |
| 세션 시작 | POST | `/monitoring/sessions` | `startedAt` | 필요 |
| 코골이 저장 | POST | `/monitoring/sessions/:sessionId/snore-event` | `startTime`, `endTime`, `avgConfidence` | 필요 |
| 알람 저장 | POST | `/monitoring/sessions/:sessionId/alarm` | `triggeredAt` | 필요 |
| 세션 종료 | PATCH | `/monitoring/sessions/:sessionId/end` | `endedAt` | 필요 |
| 리포트 목록 | GET | `/history/reports` | 없음 | 필요 |
| 리포트 상세 | GET | `/history/reports/:reportId` | 없음 | 필요 |

세션 시작 요청은 다음 형태로 고정한다. 사용자와 현재 설정은 토큰 및 DB에서 서버가 가져오므로 body로 보내지 않는다.

```json
{
  "startedAt": "2026-05-27T13:00:00.000Z"
}
```

## 프론트 연결 시 수정할 내용

현재 `client/src/api/monitoring.js`와 `client/src/api/history.js`는 저장 및 조회 요청에 목업 응답을 사용하고 있다. 실제 연동 시 아래 요청으로 교체해야 한다.

| 현재 프론트 예정 경로/필드 | 서버 계약 |
| --- | --- |
| `/monitoring/sessions/:id/snore-events` | `/monitoring/sessions/:id/snore-event` |
| `/monitoring/sessions/:id/alarms` | `/monitoring/sessions/:id/alarm` |
| `/history` 목록 요청 | `/history/reports` |
| 코골이 body의 `startedAt`, `endedAt` | `startTime`, `endTime` |

`client/src/utils/client.js`의 Axios 인터셉터는 저장된 토큰을 Bearer 헤더로 추가하므로 인증 방식은 서버 계약과 맞는다.

## 아직 남아 있는 확인/작업

- 기존 DB 비밀번호가 소스 이력에 들어갔으므로 DB 접속 비밀번호를 별도로 교체해야 한다.
- 비밀번호 로그인은 현재 평문 비교 방식이다. 저장 데이터 마이그레이션 계획과 함께 `bcrypt` 해시 검증으로 변경해야 한다.
- 세션 종료 시 생성되는 피드백은 실제 LLM 호출이 아니라 임시 점수/문구 생성 로직이다.
- `alarm_logs`가 `session_idx` 없이 사용자와 시간 범위로 연결되는 구조이므로, 동시에 겹치는 세션을 허용할 경우 DB 스키마 보완이 필요하다.
- 실제 DB 스키마와 테스트용 계정/프로필을 사용한 통합 테스트가 필요하다.

## 실행 설정

`server/.env.example`을 기준으로 로컬 `server/.env`에 환경 값을 설정한다. 실제 비밀번호와 JWT secret은 Git에 커밋하지 않는다.

Swagger UI:

```text
http://localhost:3000/api-docs
```
