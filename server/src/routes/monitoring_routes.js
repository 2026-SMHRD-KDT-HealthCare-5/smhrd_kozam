const express = require("express");
const router = express.Router();
const monitoringController = require("../controllers/monitoring_controller");
// 세션 생성 api
router.post("/session", monitoringController.createSession);

// 코골이 이벤트 저장 API
// POST / monitoring/session/:sessionId/snore-event
router.post(
  "/session/:sessionId/snore-event",
  monitoringController.saveSnoreEvent,
);
module.exports = router;
