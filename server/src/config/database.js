const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mysql = require("mysql2");

// 데이터베이스 연결 풀(Pool) 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // MySQL과 Node.js 사이의 Date 처리 기준을 UTC로 고정
  // API 명세의 "2026-05-27T07:00:00Z" 같은 UTC 시간과 맞추기 위함
  timezone: "Z",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 비동기 처리를 위해 promise 기반으로 내보내기
const promisePool = pool.promise();

// ==========================================
// DB 연결 테스트 코드 (서버 실행 시 한 번 작동)
// ==========================================
promisePool
  .getConnection()
  .then((connection) => {
    console.log("✅ DB 연결 성공! (프로젝트 DB에 정상 접속되었습니다)");
    connection.release(); // 연결 확인 후 풀에 다시 반환
  })
  .catch((err) => {
    console.error("❌ DB 연결 실패:", err.message);
  });

module.exports = promisePool;
