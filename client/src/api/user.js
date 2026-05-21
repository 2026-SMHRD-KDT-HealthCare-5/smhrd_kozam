import apiClient from "@/utils/client";

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/user/${userId}`);
  return response.data.data;
};

export const updateUser = async (userData) => {
  const response = await apiClient.patch("/user", userData);
  return response.data;
};
