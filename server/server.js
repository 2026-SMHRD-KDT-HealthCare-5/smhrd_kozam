const app = require("./src/app");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

const AI_DIR = path.resolve(__dirname, "../ai");

let aiProcess = null;

function startAIServer() {
  console.log("[AI] Node.js AI 서버 시작 중...");

  aiProcess = spawn(
    process.execPath,
    ["ai_server.js"],
    { cwd: AI_DIR, stdio: "inherit" }
  );

  aiProcess.on("error", (err) => {
    console.error("[AI] AI 서버 시작 실패:", err.message);
  });

  aiProcess.on("close", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[AI] AI 서버 비정상 종료 (code: ${code})`);
    }
    aiProcess = null;
  });
}

function stopAIServer() {
  if (aiProcess) {
    console.log("[AI] AI 서버를 종료합니다...");
    aiProcess.kill("SIGTERM");
    aiProcess = null;
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Express 서버 실행 중 → http://localhost:${PORT}`);
  startAIServer();
});

process.on("SIGINT", () => {
  stopAIServer();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAIServer();
  process.exit(0);
});
