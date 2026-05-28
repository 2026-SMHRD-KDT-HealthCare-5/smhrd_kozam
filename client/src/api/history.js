import apiClient from "@/utils/client";

export const getReportList = async (payload) => {
  const response = await apiClient.get("/history/reports");
  return response.data;
  // return {
  //   success: true,
  //   data: {
  //     lastReportId: 2,
  //     reports: [
  //       {
  //         reportId: 2,
  //         startDate: "2026-05-27",
  //         sleepDuration: 28800000,
  //         snoreCount: 12,
  //         alarmsCount: 2,
  //         score: 62,
  //       },
  //       {
  //         reportId: 1,
  //         startDate: "2026-05-26",
  //         sleepDuration: 28800000,
  //         snoreCount: 11,
  //         alarmsCount: 1,
  //         score: 61,
  //       },
  //     ],
  //   },
  //   message: "fake",
  // };
};

export const getReport = async (reportId, payload) => {
  const response = await apiClient.get(`/history/reports/${reportId}`);
  return response.data;
  // return {
  //   success: true,
  //   data: reportDataList[reportId],
  // };
};

const reportDataList = {
  1: {
    reportId: 1,

    startDate: "2026-05-26",

    graph: {
      startTime: "2026-05-26 22:00:00",
      endTime: "2026-05-27 07:00:00",
      snoreList: [
        {
          startTime: "2026-05-26 23:25:00",
          endTime: "2026-05-26 23:35:00",
        },
        {
          startTime: "2026-05-27 00:00:00",
          endTime: "2026-05-27 01:10:00",
        },
        {
          startTime: "2026-05-27 04:15:00",
          endTime: "2026-05-27 04:35:00",
        },
      ],
      alarmStamps: [
        "2026-05-26 23:30:00",
        "2026-05-27 01:05:00",
        "2026-05-27 04:25:00",
      ],
    },

    summary: {
      score: 61,
      sleepDuration: 28800000,
      startTime: "2026-05-26 22:00:00",
      endTime: "2026-05-27 07:00:00",
      snoreCount: 11,
      alarmsCount: 1,
    },

    feedback: {
      title: "어떠한 수면이었어요.",
      content:
        "피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약",
      detail:
        "상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백",
    },

    profile: {
      height: 181,
      weight: 71,
      sleepingPosture: "정자세",
      alarmCondition: "1",
    },
  },
  2: {
    reportId: 2,

    startDate: "2026-05-27",

    graph: {
      startTime: "2026-05-27 22:00:00",
      endTime: "2026-05-28 07:00:00",
      snoreList: [
        {
          startTime: "2026-05-27 23:25:00",
          endTime: "2026-05-27 23:35:00",
        },
        {
          startTime: "2026-05-28 00:00:00",
          endTime: "2026-05-28 01:10:00",
        },
        {
          startTime: "2026-05-28 04:15:00",
          endTime: "2026-05-28 04:35:00",
        },
      ],
      alarmStamps: [
        "2026-05-27 23:30:00",
        "2026-05-28 01:05:00",
        "2026-05-28 04:25:00",
      ],
    },

    summary: {
      score: 62,
      sleepDuration: 28800000,
      startTime: "2026-05-27 22:00:00",
      endTime: "2026-05-28 07:00:00",
      snoreCount: 12,
      alarmsCount: 2,
    },

    feedback: {
      title: "어떠한 수면이었어요.",
      content:
        "피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약 피드백 세줄 요약",
      detail:
        "상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백 상세 피드백",
    },

    profile: {
      height: 182,
      weight: 72,
      sleepingPosture: "정자세",
      alarmCondition: "2",
    },
  },
};
