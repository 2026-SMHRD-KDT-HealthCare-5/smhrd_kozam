import apiClient from "@/utils/client";

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/user/${userId}`);

  return response.data.data;
};

export const updateUser = async (id, userData) => {
  const response = {
    success: true,
    data: {},
  };

  return response.success;
};
