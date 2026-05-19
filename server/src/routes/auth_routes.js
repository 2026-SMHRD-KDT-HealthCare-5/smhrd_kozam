/**
 * 인증 관련 API 엔드포인트를 정의하는 라우터
 */
const express = require("express");
const authRoutes = express.Router();

const authController = require("../controllers/auth_controller");

/**
 * POST /api/auth/login
 * 로그인 요청을 처리하는 라우트
 */
authRoutes.post("/login", authController.login);

module.exports = authRoutes;
