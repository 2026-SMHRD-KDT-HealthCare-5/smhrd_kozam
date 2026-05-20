import apiClient from "@/utils/client";

export const login = async (credentials) => {
  const response = await apiClient.post(`/auth/login`, credentials);

  return response.data;
};

export const logout = () => {
  // TODO: 로그아웃 로직 구현
};

export const refreshToken = async () => {
  // TODO: 토큰 갱신 로직 구현
};
