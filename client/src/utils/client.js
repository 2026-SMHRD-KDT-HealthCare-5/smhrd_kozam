import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// TODO: 토큰 기반 인증으로 변경 시, 아래 인터셉터 수정 필요
// config.headers.Authorization = `Bearer ${token}`;
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem("userId");

  if (userId) {
    config.headers["x-user-id"] = userId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userId");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
