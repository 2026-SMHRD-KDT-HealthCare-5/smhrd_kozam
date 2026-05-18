import { useEffect, useState } from "react";
import { getUser, login as loginApi } from "@/api/auth";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUserId = localStorage.getItem("userId");

      if (!storedUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getUser(storedUserId);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const userData = await loginApi(credentials);

      setUser(userData);
      localStorage.setItem("userId", userData.id);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };

  return { user, isLoading, login, logout };
};
