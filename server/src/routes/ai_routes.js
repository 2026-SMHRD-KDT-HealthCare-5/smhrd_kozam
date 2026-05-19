const express = require("express");
const router = express.Router();
const multer = require("multer");
const aiController = require("../controllers/ai_controller");

// 메모리 버퍼에 오디오 임시 저장하는 멀터 설정
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 🎯 프론트엔드가 보낸 파일 필드명 'audio'와 일치시켜 가공한 뒤
 * 컨트롤러의 predictSnore 함수로 정상 연결합니다.
 */
router.post("/predict", upload.single("audio"), aiController.predictSnore);

// app.js가 이 파일의 핸들러(라우터 오브젝트)를 정상 취급할 수 있게 통째로 내보냅니다.
module.exports = router;
