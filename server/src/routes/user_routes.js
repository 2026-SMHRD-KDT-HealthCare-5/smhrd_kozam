/**
 * 사용자 관련 API 엔드포인트를 정의하는 라우터
 */
const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/user_controller");
const authMiddleware = require("../middlewares/auth_middleware");

// 각  라우터 경로와 컨트롤러 사이에 authMiddleware를 주입 하여 인증이 필요한 요청에 대해 JWT 검증을 수행하도록 설정
userRoutes.get("/:id", authMiddleware, userController.getUser);
userRoutes.patch("/", authMiddleware, userController.updateUser);

module.exports = userRoutes;
