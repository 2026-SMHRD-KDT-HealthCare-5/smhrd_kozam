// 토큰 유효성을 검증하는 인증 미들웨어

const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = req.headers["authorization"];
    // 2. 토큰 존재 여부 및 bearer 형식 체크
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 누락 혹은 형식이 올바르지 않습니다.",
      });
    }
    // 3. 토큰에서 실제 토큰 부분만 추출
    const token = authHeader.split(" ")[1];
    // 4. env의 비밀키를 이용해 토큰 검증 및 복호화
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 5. 검증 성공시, 토큰에 들어있는 userId를 요청 객체 심고,
    // 이렇게하면 다음 컨트롤러에서 req.userId를 바로 꺼내서 사용 가능
    req.userId = decoded.userId;
    // 6. 다음 미들웨어 또는 컨트롤러로 제어를 넘김
    next();
  } catch (error) {
    // 7. 토큰 만료, 위조 등 검증 실패 시 에러 처리
    console.error("❌ 인증 미들웨어 에러:", error.message);
    return res.status(401).json({
      success: false,
      message: "유효하지 않거나 만료된 토큰입니다.",
    });
  }
};
