import apiClient from "@/utils/client";

export const createSession = async (payload) => {
  const response = await apiClient.post("/monitoring/sessions", payload);
  return response.data;
};

export const updateSession = async (sessionId, payload) => {
  const response = await apiClient.patch(
    `/monitoring/sessions/${sessionId}/end`,
    payload,
  );
  return response.data;
};

export const createSnoreEvent = async (sessionId, payload) => {
  const response = await apiClient.post(
    `/monitoring/sessions/${sessionId}/snore-event`,
    payload,
  );
  return response.data;
};

export const createAlarmLog = async (sessionId, payload) => {
  const response = await apiClient.post(
    `/monitoring/sessions/${sessionId}/alarm`,
    payload,
  );
  return response.data;
};

export const predictSnore = async (payload) => {
  const response = await apiClient.post("/ai/predict", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
