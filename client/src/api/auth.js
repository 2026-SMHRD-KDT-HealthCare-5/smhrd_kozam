import axios from "axios";

export const login = async (data) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/login`,
    data,
  );

  return response.data;
};
