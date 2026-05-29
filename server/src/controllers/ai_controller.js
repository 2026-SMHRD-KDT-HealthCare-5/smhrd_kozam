const axios = require("axios");
const FormData = require("form-data");

const AI_SERVER_URL = "http://127.0.0.1:5000/predict";

exports.predictSnore = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "오디오 파일이 필요합니다.",
      });
    }

    const formData = new FormData();
    formData.append("audio", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(AI_SERVER_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const { prediction, snore_prob, rms } = response.data;

    const calculatedScore = 0.5 * snore_prob + 0.3 * Math.min(rms / 0.1, 1.0);
    const intensity =
      prediction === "snore"
        ? calculatedScore > 0.4 ? "high" : "low"
        : "normal";

    return res.json({
      success: true,
      data: {
        predicted: prediction,
        snoreProb: snore_prob,
        rms,
        intensity,
      },
    });
  } catch (error) {
    if (error.response) {
      console.error("[AI] 오류 응답:", error.response.status, error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: "AI 서버에서 오류를 반환했습니다.",
        detail: error.response.data,
      });
    } else if (error.request) {
      console.error("[AI] 응답 없음 (서버 다운 또는 타임아웃)");
      return res.status(503).json({
        success: false,
        message: "AI 서버에 연결할 수 없습니다.",
        error: error.message,
      });
    } else {
      console.error("[AI] 요청 오류:", error.message);
      return res.status(500).json({
        success: false,
        message: "AI 요청 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }
};
