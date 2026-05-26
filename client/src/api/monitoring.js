import apiClient from "@/utils/client";
import { sleep } from "@/utils/common";

export const createSession = async (payload) => {
  // const response = await apiClient.post("/monitoring/sessions", payload);
  // return response.data;
  await sleep(2000);
  return { success: true, data: { sessionId: 1 } };
};

export const updateSession = async (sessionId, payload) => {
  // const response = await apiClient.patch(
  //   `/monitoring/sessions/${sessionId}/end`,
  //   payload,
  // );
  // return response.data;
  await sleep(2000);
  return { success: true, data: { reportId: 1 } };
};

export const createSnoreEvent = async (sessionId, payload) => {
  // const response = await apiClient.post(
  //   `/monitoring/sessions/${sessionId}/snore-events`,
  //   payload,
  // );
  // return response.data;
  await sleep(2000);
  return { success: true, data: {} };
};

export const createAlarmLog = async (sessionId, payload) => {
  // const response = await apiClient.post(
  //   `/monitoring/sessions/${sessionId}/alarms`,
  //   payload,
  // );
  // return response.data;
  await sleep(2000);
  return { success: true, data: {} };
};

export const predictSnore = async (payload) => {
  const response = await apiClient.post("/ai/predict", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
