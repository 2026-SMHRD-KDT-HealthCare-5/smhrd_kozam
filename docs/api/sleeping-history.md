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
        "alarmsCount": 3,
        "score": 60
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

    "graph": {
      "startTime": "2026-05-26T22:00:00Z",
      "endTime": "2026-05-27T07:00:00Z",
      "snoreList": [
        {
          "startTime": "2026-05-27T01:00:00Z",
          "endTime": "2026-05-27T01:15:00Z"
        }
      ],
      "alarmStamps": ["2026-05-26T23:30:00Z", "2026-05-27T04:25:00Z"]
    },

    "summary": {
      "score": 60,
      "sleepDuration": 28800000,
      "startTime": "2026-05-26T22:00:00Z",
      "endTime": "2026-05-27T07:00:00Z",
      "snoreCount": 13,
      "alarmsCount": 3
    },

    "feedback": {
      "title": "어떠한 수면이었어요.",
      "content": "피드백 세줄 요약",
      "detail": "상세 피드백"
    },

    "profile": {
      "height": 180,
      "weight": 70,
      "sleepingPosture": "정자세",
      "alarmCondition": "2"
    }
  }
}
```
