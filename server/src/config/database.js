const mysql = require("mysql2");

// 데이터베이스 연결 풀(Pool) 생성
const pool = mysql.createPool({
  host: "project-db-campus.smhrd.com",
  port: 3312,
  user: "cd_25K_HI5_p2_1",
  password: "smhrd1",
  database: "cd_25K_HI5_p2_1",
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
