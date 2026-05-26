import apiClient from "@/utils/client";

export const login = async (credentials) => {
  const response = await apiClient.post(`/auth/login`, credentials);
  console.log("백엔드 응답 전체:", response.data);
  // 백엔드(auth_controller.js)에서 돌려준 user 객체 속의 token 꺼내기
  const { token, userId } = response.data.user;
  if (token) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userId", userId); // 사용자 ID도 저장 안정성!! 때문에 추가 삽입
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId"); // 사용자 ID도 삭제 안정성!! 때문에 추가 삽입
};
