import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// TODO: 토큰 기반 인증으로 변경 시, 아래 인터셉터 수정 필요
// config.headers.Authorization = `Bearer ${token}`;
// 로컬 스토리지에서 백엔드가 발급해 준 jwt 토큰 꺼내기
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      //만료된 토큰 삭제
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId"); // 사용자 ID도 삭제 안정성!! 때문에 추가 삽입

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
