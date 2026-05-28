const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth_routes");
const aiRoutes = require("./routes/ai_routes");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const userRoutes = require("./routes/user_routes");
require("dotenv").config();
const monitoringRoutes = require("./routes/monitoring_routes"); //모니터링 라우터추가
const historyRoutes = require("./routes/history_routes"); //히스토리 라우터 추가

// ==========================================
// 0. Swagger (스웨거) 설정 정의
// ==========================================
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Node.js API 문서",
      version: "1.0.0",
      description: "인증(Auth) 및 AI 기능을 제공하는 API 문서입니다.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // src 폴더 내부의 파일들을 스캔합니다.
  apis: ["./src/app.js", "./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 1. CORS 설정
app.use(
  cors({
    origin: `http://localhost:${process.env.CORS_PORT}`,
  }),
);

// 2. json 파싱
app.use(express.json());

// 3. 로깅 미들웨어
app.use((req, res, next) => {
  console.log(
    `\n[${new Date().toLocaleTimeString()}] 요청 도착 : ${req.method} ${req.url}`,
  );
  next();
});

//* prettier-ignore */
/**
 * @swagger
 * /:
 *   get:
 *     summary: 서버 작동 여부 확인
 *     description: 백엔드 서버가 정상적으로 켜져 있는지 확인하는 루트 경로입니다.
 *     responses:
 *       200:
 *         description: 성공적으로 서버가 작동 중임
 */
// 4. 서버 확인용 루트
app.get("/", (req, res) => {
  res.send("백엔드 서버가 정상적으로 작동 중!!!!");
});

// 5. 경로 마운트 설정
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/history", historyRoutes);

// 6. 에러 처리 미들웨어
app.use((err, req, res, next) => {
  void next;
  console.error("\n[에러 발생]");
  console.error("메시지:", err.message);
  console.error("스택:", err.stack);

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
