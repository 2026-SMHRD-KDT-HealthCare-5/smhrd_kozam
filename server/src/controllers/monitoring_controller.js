const monitoringService = require("../services/monitoring_service");

/**
 * 날짜 문자열이 유효한지 확인하는 함수
 *
 * @param {string} value - 검사할 날짜 문자열
 * @return {boolean} - 유효한 날짜면 true, 아니면 false
 */
const isValidDate = (value) => {
  return !Number.isNaN(new Date(value).getTime());
};

/**
 * 수면 세션 생성 컨트롤러
 *
 * 역할:
 * 1. 클라이언트 body에서 startedAt을 받는다.
 * 2. 인증된 사용자 ID를 service에 전달한다.
 * 3. service가 현재 프로필과 알람 설정을 조회하여 세션을 만든다.
 */
const createSession = async (req, res) => {
  try {
    const { startedAt } = req.body;

    // startedAt 필수값 검증
    if (!startedAt) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startedAt 값이 필요합니다.",
      });
    }

    // startedAt 날짜 형식 검증
    if (!isValidDate(startedAt)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startedAt 날짜 형식이 올바르지 않습니다.",
      });
    }

    const result = await monitoringService.createSession({
      startedAt,
      userIdx: Number(req.userId),
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: result.sessionId,
      },
      message: "세션 생성 완료",
    });
  } catch (error) {
    console.error("세션 생성 중 오류:", error);

    if (error.message === "모니터링 프로필을 찾을 수 없습니다.") {
      return res.status(400).json({
        success: false,
        data: {},
        message: "모니터링을 시작하려면 프로필 설정이 필요합니다.",
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "세션 생성 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 코골이 이벤트 저장 컨트롤러
 *
 * 역할:
 * 1. URL params에서 sessionId를 추출한다.
 * 2. body에서 startTime, endTime, avgConfidence를 추출한다.
 * 3. 값 검증 후 service에 저장 요청을 보낸다.
 */
const createSnoreEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { startTime, endTime, avgConfidence } = req.body;

    // sessionId 숫자 검증
    if (!sessionId || Number.isNaN(Number(sessionId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효한 sessionId 값을 입력해주세요.",
      });
    }

    // 필수값 검증
    // avgConfidence는 0도 유효한 값이므로 undefined/null로 검사한다.
    if (
      !startTime ||
      !endTime ||
      avgConfidence === undefined ||
      avgConfidence === null
    ) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startTime, endTime, avgConfidence 값이 필요합니다.",
      });
    }

    // 날짜 형식 검증
    if (!isValidDate(startTime) || !isValidDate(endTime)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startTime 또는 endTime 날짜 형식이 올바르지 않습니다.",
      });
    }

    // endTime이 startTime보다 빠르면 잘못된 데이터
    if (new Date(endTime).getTime() < new Date(startTime).getTime()) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "endTime은 startTime보다 빠를 수 없습니다.",
      });
    }

    // avgConfidence 숫자 및 범위 검증
    if (
      Number.isNaN(Number(avgConfidence)) ||
      Number(avgConfidence) < 0 ||
      Number(avgConfidence) > 1
    ) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "avgConfidence 값은 0과 1 사이여야 합니다.",
      });
    }

    // service에 코골이 이벤트 저장 요청
    // 중요: 여러 인자로 쪼개지 않고 객체 하나로 전달한다.
    await monitoringService.createSnoreEvent({
      sessionId: Number(sessionId),
      userIdx: Number(req.userId),
      startTime,
      endTime,
      avgConfidence: Number(avgConfidence),
    });

    return res.status(201).json({
      success: true,
      data: {},
      message: "코골이 이벤트 저장 완료",
    });
  } catch (error) {
    console.error("코골이 이벤트 저장 중 오류:", error);

    if (error.message === "세션을 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 세션입니다.",
      });
    }

    if (error.message === "이미 종료된 세션입니다.") {
      return res.status(409).json({
        success: false,
        data: {},
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "코골이 이벤트 저장 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 알람 로그 저장 컨트롤러
 *
 * 역할:
 * 1. URL params에서 sessionId를 추출한다.
 * 2. body에서 triggeredAt을 추출한다.
 * 3. 선택값으로 alarmType, alarmContent를 받을 수 있다.
 * 4. service에 알람 로그 저장 요청을 보낸다.
 *
 * 주의:
 * 현재 DB의 alarm_logs에는 session_idx가 없다.
 * 따라서 service/model에서 sessionId로 세션을 조회한 뒤,
 * 해당 세션의 user_idx를 사용해서 alarm_logs.user_idx에 저장한다.
 */
const createAlarmLog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { triggeredAt, alarmType, alarmContent } = req.body;

    // sessionId 검증
    if (!sessionId || Number.isNaN(Number(sessionId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효하지 않은 sessionId 값입니다.",
      });
    }

    // triggeredAt 필수값 검증
    if (!triggeredAt) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "triggeredAt 값은 필수입니다.",
      });
    }

    // triggeredAt 날짜 형식 검증
    if (!isValidDate(triggeredAt)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "triggeredAt 날짜 형식이 올바르지 않습니다.",
      });
    }

    // service에 알람 로그 저장 요청
    // 중요: 객체 하나로 전달한다.
    await monitoringService.createAlarmLog({
      sessionId: Number(sessionId),
      userIdx: Number(req.userId),
      triggeredAt,

      // DB에 alarm_type, alarm_content 컬럼이 있으므로 선택값으로 받는다.
      // 클라이언트가 보내지 않으면 service에서 기본값 처리한다.
      alarmType,
      alarmContent,
    });

    return res.status(201).json({
      success: true,
      data: {},
      message: "알람 로그 저장 완료",
    });
  } catch (error) {
    console.error("알람 로그 저장 중 오류:", error);

    if (error.message === "세션을 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 세션입니다.",
      });
    }

    if (error.message === "이미 종료된 세션입니다.") {
      return res.status(409).json({
        success: false,
        data: {},
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "알람 로그 저장 중 오류가 발생했습니다.",
    });
  }
};
/**
 * 수면 세션 종료
 * body에서 endedAt을 추출
 * service에 세션 종료 처리를 요청
 * 생성된 reportId를 응답
 */
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endedAt } = req.body;
    // sessionId 숫자 검증
    if (!sessionId || Number.isNaN(Number(sessionId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효하지 않은 sessionId 값입니다.",
      });
    }
    // endedAt 필수값 검증
    if (!endedAt) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "endedAt 값이 필요합니다.",
      });
    }
    // endedAt 날짜 형식 검증
    if (!isValidDate(endedAt)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "endedAt 날짜 형식이 올바르지 않습니다.",
      });
    }

    // service에 세션 종료 처리를 요청
    const result = await monitoringService.endSession({
      sessionId: Number(sessionId),
      userIdx: Number(req.userId),
      endedAt,
    });

    return res.status(200).json({
      success: true,
      data: { reportId: result.reportId },
      message: "세션 종료 완료",
    });
  } catch (error) {
    console.error("세션 종료 중 오류:", error);

    if (error.message === "세션을 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 세션입니다.",
      });
    }

    if (
      error.message === "이미 종료된 세션입니다." ||
      error.message === "종료 시간은 시작 시간보다 빠를 수 없습니다."
    ) {
      return res.status(409).json({
        success: false,
        data: {},
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "세션 종료 중 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  createSession,
  createSnoreEvent,
  createAlarmLog,
  endSession,
};
