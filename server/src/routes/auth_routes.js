/**
 * 인증 관련 API 엔드포인트를 정의하는 라우터
 */
const express = require("express");
const authRoutes = express.Router();
const authController = require("../controllers/auth_controller");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginId:
 *                 type: string
 *                 example: test_user
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */
authRoutes.post("/login", authController.login);

module.exports = authRoutes;
