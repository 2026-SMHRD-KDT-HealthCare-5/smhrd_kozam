const app = require("./src/app");
const PORT = 3000;

const cors = require("cors"); // 외부도구 불러오기 (보안정책상 입력해줘야 프론트 데이터를 받아올수있음)
app.use(cors()); // APP에서 CORS 사용

app.listen(PORT, () => {
  console.log(`서버실행중...⌛   ${PORT}번포트 사용`);
});
