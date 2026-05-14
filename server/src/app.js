const express = require("express");

const authRoutes = require("./routes/auth.routes");

const app = express();

// JSON 요청 body 파싱
app.use(express.json());

// route 등록
app.use("/api/auth", authRoutes);

module.exports = app;
