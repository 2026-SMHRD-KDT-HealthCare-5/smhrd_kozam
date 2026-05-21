/**
 * 사용자 관련 API 엔드포인트를 정의하는 라우터
 */
const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/user_controller");

userRoutes.get("/:id", userController.getUser);
userRoutes.patch("/", userController.updateUser);
userRoutes.patch("/setting", userController.updateSettings);

module.exports = userRoutes;
