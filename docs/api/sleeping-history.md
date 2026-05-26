# History API

---

## 📌 사용자별 report 목록 조회

### Endpoint

```http
GET /history/reports
```

### res

```json
{
  "success": true,
  "data": {
    "lastReportId": 1,
    "reports": [
      {
        "reportId": 1,
        "startDate": "2026-05-26",
        "sleepDuration": 28800000,
        "snoreCount": 13,
        "alarmsCount": 3
      }
    ]
  },
  "message": ""
}
```

---

## 📌 report 데이터 조회

### Endpoint

```http
GET /history/reports/:reportId
```

### res

```json
{
  "success": true,
  "data": {
    "reportId": 1,
    "startDate": "2026-05-26",
    "sleepDuration": 28800000,
    "startTime": "2026-05-26T22:00:00Z",
    "endTime": "2026-05-27T07:00:00Z",
    "alarmCondition": "2",
    "alarmStamps": ["2026-05-26T23:30:00Z", "2026-05-27T04:25:00Z"],
    "feedback": {
      "title": "어떠한 수면이었어요.",
      "content": "피드백 세줄 요약",
      "detail": "상세 피드백"
    },
    "height": 180,
    "weight": 70,
    "sleepingPosture": "정자세"
  }
}
```
