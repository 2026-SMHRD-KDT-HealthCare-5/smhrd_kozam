const axios = require("axios");
const FormData = require("form-data");

// 🎯 파이썬 FastAPI 서버가 기다리는 진짜 순수 주소로 지정 (/ai 제거)
const AI_SERVER_URL = "http://localhost:8000/api/ai/predict";

/**
 * AI 서버에 오디오 파일 예측을 요청하는 컨트롤러
 */
exports.predictSnore = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "오디오 파일이 필요합니다.",
      });
    }

    // AI 서버로 보낼 FormData 생성
    const formData = new FormData();
    formData.append("audio", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // AI 서버에 요청 전송
    const response = await axios.post(AI_SERVER_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("AI 서버 응답 성공:", response.data);

    // 파이썬 서버의 반환 규격(prediction 내부 데이터)에 맞춰 안전하게 조율하여 토스
    if (response.data && response.data.prediction) {
      return res.json({
        success: true,
        data: {
          predicted: response.data.prediction.predicted,
          snoreProb: response.data.prediction.snore_prob,
          rms: response.data.prediction.rms,
          intensity: response.data.prediction.intensity,
        },
      });
    }

    return res.json(response.data);
  } catch (error) {
    console.error("AI 서버 요청 중 상세 오류:");
    if (error.response) {
      console.error("상태 코드:", error.response.status);
      console.error("응답 데이터:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: "AI 서버에서 오류를 반환했습니다.",
        detail: error.response.data,
      });
    } else if (error.request) {
      console.error("응답 없음 (서버 다운 또는 타임아웃)");
      return res.status(503).json({
        success: false,
        message: "AI 서버에 연결할 수 없거나 응답이 없습니다.",
        error: error.message,
      });
    } else {
      console.error("요청 설정 오류:", error.message);
      return res.status(500).json({
        success: false,
        message: "AI 요청을 준비하는 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }
};
