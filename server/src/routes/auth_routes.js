const express = require("express");
const authRoutes = express.Router();

const authController = require("../controllers/auth_controller");

// POST /api/auth/login
authRoutes.post("/login", authController.login);

module.exports = authRoutes;
