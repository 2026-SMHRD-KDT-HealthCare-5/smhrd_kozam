const express = require("express");
const router = express.Router();

const monitoringController = require("../controllers/monitoring_controller");

/**
 * 수면 세션 생성 API
 *
 * 실제 최종 경로:
 * app.js에서 app.use("/api/monitoring", monitoringRoutes)로 연결했다면
 * POST /api/monitoring/sessions
 */
router.post("/sessions", monitoringController.createSession);

/**
 * 코골이 이벤트 저장 API
 *
 * 실제 최종 경로:
 * POST /api/monitoring/sessions/:sessionId/snore-event
 */
router.post(
  "/sessions/:sessionId/snore-event",
  monitoringController.createSnoreEvent,
);

/**
 * 알람 로그 저장 API
 *
 * 실제 최종 경로:
 * POST /api/monitoring/sessions/:sessionId/alarm
 */
router.post("/sessions/:sessionId/alarm", monitoringController.createAlarmLog);

module.exports = router;
