import apiClient from "@/utils/client";

export const getUserById = async (userId) => {
  if (!userId) return;

  const response = await apiClient.get(`/user/${userId}`);

  return response.data.data;
};

export const updateUser = async (userData) => {
  if (!userData) return;

  const response = await apiClient.patch("/user", userData);

  return response.data;
};
