const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth_routes");
const aiRoutes = require("./routes/ai_routes");
require("dotenv").config();

// 1. CORS 설정 - 보안때문에 막힐수있어서 최상단에 위치
app.use(
  cors({
    origin: `http://localhost:${process.env.CORS_PORT}`,
  }),
);

//2. json 파싱 (# 로깅 미들웨어보다 위에 있어야 req.body를 읽음)
app.use(express.json());

//3. 로깅 미들웨어
app.use((req, res, next) => {
  //  요청의 기본 정보 기록
  console.log(
    `\n[${new Date().toLocaleTimeString()}] 요청 도착 : ${req.method} ${req.url}`,
  );
  // req.body가 존재할 때만 검사하도록 수정 (에러 해결 핵심)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("DB 확인 :", req.body);
  }
  // 다음단계로 넘어가기
  next();
});

// 4. 서버 확인용 루트
app.get("/", (req, res) => {
  res.send("백엔드 서버가 정상적으로 작동 중!!!!");
});
// 5 . 경로 마운트 설정 - 인증경로 중심역할
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// 6. 에러 처리 미들웨어 (모든 에러를 여기서 처리)
app.use((err, req, res, next) => {
  console.error("\n[에러 발생]");
  console.error("메시지:", err.message);
  console.error("스택:", err.stack);

  // Multer 에러 처리
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "파일 필드명이 올바르지 않습니다. 'audio' 필드를 사용해주세요.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "서버 내부 오류가 발생했습니다.",
  });
});

module.exports = app;
