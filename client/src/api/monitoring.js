import apiClient from "@/utils/client";

export const createSession = async (payload) => {
  const response = await apiClient.post("/monitoring/sessions", payload);

  return response.data.data;
};

export const updateSession = async (sessionId, payload) => {
  const response = await apiClient.patch(
    `/monitoring/sessions/${sessionId}/end`,
    payload,
  );

  return response.data.data;
};

export const createSnoreEvent = async (sessionId, payload) => {
  const response = await apiClient.post(
    `/monitoring/sessions/${sessionId}/snore-events`,
    payload,
  );

  return response.data.data;
};

export const createAlarmLog = async (sessionId, payload) => {
  const response = await apiClient.post(
    `/monitoring/sessions/${sessionId}/alarms`,
    payload,
  );

  return response.data.data;
};
