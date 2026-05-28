const express = require("express");
const router = express.Router();

const historyController = require("../controllers/history_controller");
const authMiddleware = require("../middlewares/auth_middleware");

/**
 * @swagger
 * /api/history/reports:
 *   get:
 *     summary: 로그인 사용자의 수면 리포트 목록 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 리포트 목록 조회 완료
 *       401:
 *         description: 인증 필요
 */
router.get("/reports", authMiddleware, historyController.getReports);

/**
 * @swagger
 * /api/history/reports/{reportId}:
 *   get:
 *     summary: 로그인 사용자의 수면 리포트 상세 조회
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 리포트 상세 조회 완료
 *       404:
 *         description: 접근 가능한 리포트 없음
 */
router.get(
  "/reports/:reportId",
  authMiddleware,
  historyController.getReportById,
);

module.exports = router;
