const express = require("express");
const router = express.Router();

const monitoringController = require("../controllers/monitoring_controller");
const authMiddleware = require("../middlewares/auth_middleware");

/**
 * @swagger
 * /api/monitoring/sessions:
 *   post:
 *     summary: 수면 세션 생성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startedAt]
 *             properties:
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 세션 생성 완료
 *       401:
 *         description: 인증 필요
 */
router.post("/sessions", authMiddleware, monitoringController.createSession);

/**
 * @swagger
 * /api/monitoring/sessions/{sessionId}/snore-event:
 *   post:
 *     summary: 코골이 이벤트 저장
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime, avgConfidence]
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               avgConfidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       201:
 *         description: 코골이 이벤트 저장 완료
 */
router.post(
  "/sessions/:sessionId/snore-event",
  authMiddleware,
  monitoringController.createSnoreEvent,
);

/**
 * @swagger
 * /api/monitoring/sessions/{sessionId}/alarm:
 *   post:
 *     summary: 알람 로그 저장
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [triggeredAt]
 *             properties:
 *               triggeredAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 알람 로그 저장 완료
 */
router.post(
  "/sessions/:sessionId/alarm",
  authMiddleware,
  monitoringController.createAlarmLog,
);

/**
 * @swagger
 * /api/monitoring/sessions/{sessionId}/end:
 *   patch:
 *     summary: 수면 세션 종료 및 리포트 생성
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endedAt]
 *             properties:
 *               endedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 세션 종료 완료
 */
router.patch(
  "/sessions/:sessionId/end",
  authMiddleware,
  monitoringController.endSession,
);
module.exports = router;
