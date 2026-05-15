const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth_routes");
require("dotenv").config();

// JSON 요청 body 파싱
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: `http://localhost:${process.env.CORS_PORT}`,
  }),
);

// route 등록
app.use("/api/auth", authRoutes);

module.exports = app;
