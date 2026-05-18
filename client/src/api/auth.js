import apiClient from "@/api/client";

export const login = async (data) => {
  const response = await apiClient.post(
    `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
    data,
  );

  return response.data;
};
