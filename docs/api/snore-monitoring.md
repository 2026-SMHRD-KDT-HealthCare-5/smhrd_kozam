# Session API

---

## 📌 세션 생성

### Endpoint

```http
POST /monitoring/sessions
```

### req

```json
{
  "userId": 1,
  "startedAt": "2026-05-23T22:00:00Z"
}
```

> JWT 적용 후 `userId` 제거 예정

### res

```json
{
  "success": true,
  "data": {
    "sessionId": 1
  },
  "message": "세션 생성 완료"
}
```

### description

1. 세션 데이터 insert

---

## 📌 세션 종료

### Endpoint

```http
PATCH /monitoring/sessions/:sessionId/end
```

### req

```json
{
  "userId": 1,
  "endedAt": "2026-05-24T06:30:00Z"
}
```

> JWT 적용 후 `userId` 제거 예정

### res

```json
{
  "success": true,
  "data": {
    "reportId": 1
  },
  "message": "세션 종료 완료"
}
```

### description

1. DB에서 해당 세션 row의 `end_time` 값 update

2. 사용자 신체 정보, 세션 시간, 코골이 기록, 알람 발생 시간 및 횟수를 기반으로  
   LLM API 호출 후 수면 세션 분석 및 코골이 개선 팁 생성

3. LLM 응답 형태

```json
{
  "title": "어떠한 수면이었어요.",
  "content": "피드백 세줄 요약",
  "detail": "상세 피드백"
}
```

4. `sleep_reports` 테이블의 `feedback` 컬럼에 저장 후  
   생성된 row id를 `res.data.reportId` 에 담아서 반환

---

# Snore API

---

## 📌 코골이 이벤트 저장

### Endpoint

```http
POST /monitoring/sessions/:sessionId/snore-event
```

### req

```json
{
  "userId": 1,
  "startTime": "2026-05-24T01:12:30Z",
  "endTime": "2026-05-24T01:12:48Z",
  "avgConfidence": 0.82
}
```

> JWT 적용 후 `userId` 제거 예정

### res

```json
{
  "success": true,
  "data": {},
  "message": "코골이 이벤트 저장 완료"
}
```

---

# Alarm API

---

## 📌 알람 로그 저장

### Endpoint

```http
POST /monitoring/sessions/:sessionId/alarm
```

### req

```json
{
  "userId": 1,
  "triggeredAt": "2026-05-24T01:13:00Z"
}
```

> JWT 적용 후 `userId` 제거 예정

### res

```json
{
  "success": true,
  "data": {},
  "message": "알람 로그 저장 완료"
}
```