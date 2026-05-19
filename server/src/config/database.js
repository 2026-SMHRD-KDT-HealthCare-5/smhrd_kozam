const mysql = require("mysql2");

// 데이터베이스 연결 풀(Pool) 생성
// 매번 연결하고 끊는 것보다 '풀'을 만들어 재사용하는 것이 효율적입니다.
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

module.exports = promisePool;
