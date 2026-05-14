const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth_routes");

// JSON 요청 body 파싱
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// route 등록
app.use("/api/auth", authRoutes);

module.exports = app;
