import axios from "axios";

export const login = async (data) => {
  const response = await axios.post(
    "http://localhost:3000/api/auth/login",
    data,
  );

  return response.data;
};
