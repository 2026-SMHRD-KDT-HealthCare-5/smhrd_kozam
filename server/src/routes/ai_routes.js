const express = require("express");
const router = express.Router();
const multer = require("multer");
const aiController = require("../controllers/ai_controller");

// 메모리 버퍼에 오디오 임시 저장하는 멀터 설정
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/ai/predict:
 *   post:
 *     summary: 오디오 코골이 예측 요청
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [audio]
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 예측 완료
 *       400:
 *         description: 오디오 파일 누락 또는 유효하지 않음
 *       503:
 *         description: FastAPI 서버에 연결할 수 없음
 */
router.post("/predict", upload.single("audio"), aiController.predictSnore);

// app.js가 이 파일의 핸들러(라우터 오브젝트)를 정상 취급할 수 있게 통째로 내보냅니다.
module.exports = router;
