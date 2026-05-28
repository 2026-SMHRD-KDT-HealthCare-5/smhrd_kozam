const historyModel = require("../models/history_model");

/**
 * Date 값을 ISO 문자열로 변환한다.
 *
 * DB에서 Date 객체 또는 문자열이 올 수 있으므로
 * API 명세 형식인 ISO 문자열로 정리한다.
 *
 * @param {Date|string|null} value - 날짜 값
 * @return {string|null} ISO 문자열 또는 null
 */
const toISOStringOrNull = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

/**
 * 수면 점수 계산 함수
 *
 * 현재 DB에는 score 컬럼이 없으므로 임시 계산식을 사용한다.
 *
 * 계산 기준:
 * - 기본 점수 100점
 * - 코골이 1회당 2점 감점
 * - 알람 1회당 5점 감점
 * - 10점 단위로 반올림
 * - 최소 0점, 최대 100점
 *
 * 예:
 * snoreCount 13, alarmsCount 3이면
 * 100 - 26 - 15 = 59
 * 10점 단위 반올림 → 60
 *
 * @param {number} snoreCount - 코골이 횟수
 * @param {number} alarmsCount - 알람 횟수
 * @return {number} 수면 점수
 */
const calculateSleepScore = (snoreCount, alarmsCount) => {
  const rawScore = 100 - snoreCount * 2 - alarmsCount * 5;

  const roundedScore = Math.round(rawScore / 10) * 10;

  return Math.max(0, Math.min(100, roundedScore));
};

/**
 * feedback 값을 API 명세 구조로 변환한다.
 *
 * 현재 sleep_reports.feedback 컬럼은 하나뿐이다.
 * 명세는 title, content, detail 구조를 요구한다.
 *
 * 처리 방식:
 * 1. feedback이 JSON 문자열이면 title/content/detail로 파싱
 * 2. 일반 문자열이면 content/detail에 같은 값을 넣음
 * 3. 값이 없으면 score 기준 기본 피드백 생성
 *
 * @param {string|null} feedbackValue - DB의 sleep_reports.feedback 값
 * @param {number} score - 수면 점수
 * @return {Object} feedback 객체
 */
const formatFeedback = (feedbackValue, score) => {
  if (feedbackValue) {
    try {
      const parsedFeedback = JSON.parse(feedbackValue);

      return {
        title: parsedFeedback.title || "수면 리포트",
        content: parsedFeedback.content || "",
        detail: parsedFeedback.detail || "",
      };
    } catch {
      return {
        title: "수면 리포트",
        content: feedbackValue,
        detail: feedbackValue,
      };
    }
  }

  if (score >= 80) {
    return {
      title: "안정적인 수면이었어요.",
      content: "코골이와 알람 발생이 적은 편이에요.",
      detail: "전반적으로 수면 흐름이 크게 방해받지 않은 것으로 보입니다.",
    };
  }

  if (score >= 50) {
    return {
      title: "중간 정도의 수면이었어요.",
      content: "코골이나 알람 발생이 어느 정도 있었어요.",
      detail:
        "수면 중 방해 요소가 일부 있었으므로 코골이 발생 시간대를 확인해보는 것이 좋습니다.",
    };
  }

  return {
    title: "방해가 많은 수면이었어요.",
    content: "코골이 또는 알람 발생이 많은 편이에요.",
    detail:
      "수면 품질이 낮게 측정되었습니다. 반복된다면 수면 환경이나 자세를 점검해보는 것이 좋습니다.",
  };
};

/**
 * 사용자별 report 목록 조회 서비스
 *
 * @param {Object} historyQueryData - 조회 조건 객체
 * @param {number} historyQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Object>} report 목록 응답 데이터
 */
const getReports = async (historyQueryData = {}) => {
  const reports = await historyModel.findReports(historyQueryData);
  console.log(`reports: ${JSON.stringify(reports)}`);

  const formattedReports = reports.map((report) => {
    const snoreCount = Number(report.snoreCount || 0);
    const alarmsCount = Number(report.alarmsCount || 0);
    const score = calculateSleepScore(snoreCount, alarmsCount);

    return {
      reportId: report.reportId,
      startDate: report.startDate,
      sleepDuration: Number(report.sleepDuration || 0),
      snoreCount,
      alarmsCount,
      score,
    };
  });

  const lastReportId =
    formattedReports.length > 0 ? formattedReports[0].reportId : null;

  return {
    lastReportId,
    reports: formattedReports,
  };
};

/**
 * report 상세 데이터 조회 서비스
 *
 * 역할:
 * 1. report 기본 데이터 조회
 * 2. 코골이 구간 목록 조회
 * 3. 알람 발생 시간 목록 조회
 * 4. API 명세에 맞게 graph, summary, feedback, profile 구조로 조립
 *
 * @param {Object} reportQueryData - report 조회 조건 객체
 * @param {number} reportQueryData.reportId - 조회할 report ID
 * @param {number} reportQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Object>} report 상세 응답 데이터
 */
const getReportById = async (reportQueryData) => {
  const report = await historyModel.findReportById(reportQueryData);

  if (!report) {
    throw new Error("리포트를 찾을 수 없습니다.");
  }

  const snoreRows = await historyModel.findSnoreListByReportId(reportQueryData);
  const alarmRows =
    await historyModel.findAlarmStampsByReportId(reportQueryData);

  const snoreList = snoreRows.map((snore) => {
    return {
      startTime: toISOStringOrNull(snore.startTime),
      endTime: toISOStringOrNull(snore.endTime),
    };
  });

  const alarmStamps = alarmRows.map((alarm) => {
    return toISOStringOrNull(alarm.triggeredAt);
  });

  const snoreCount = Number(report.snoreCount || 0);
  const alarmsCount = Number(report.alarmsCount || 0);
  const score = calculateSleepScore(snoreCount, alarmsCount);
  const sleepDuration = Number(report.sleepDuration || 0);

  return {
    reportId: report.reportId,

    startDate: report.startDate,

    graph: {
      startTime: toISOStringOrNull(report.startTime),
      endTime: toISOStringOrNull(report.endTime),
      snoreList,
      alarmStamps,
    },

    summary: {
      score,
      sleepDuration,
      startTime: toISOStringOrNull(report.startTime),
      endTime: toISOStringOrNull(report.endTime),
      snoreCount,
      alarmsCount,
    },

    feedback: formatFeedback(report.feedback, score),

    profile: {
      height: report.height === null ? null : Number(report.height),
      weight: report.weight === null ? null : Number(report.weight),
      sleepingPosture: report.sleepingPosture,
      alarmCondition: report.alarmCondition,
    },
  };
};

module.exports = {
  getReports,
  getReportById,
};
