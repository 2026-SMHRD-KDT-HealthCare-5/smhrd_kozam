import apiClient from "@/utils/client";

export const login = async (credentials) => {
  const response = await apiClient.post(`/auth/login`, credentials);

  return response.data;
};

// TODO: 실제 API 구현 후, 아래 함수 수정 필요
export const getUser = async (userId) => {
  // const response = await apiClient.get(`/users/${userId}`);

  // return response.data;
  return {
    id: 1,
    loginId: "test123",
    nick: "해성",
  };
};
