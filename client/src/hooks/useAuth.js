import { useEffect, useState } from "react";
import { login as loginApi } from "@/api/auth";
import { getUserById } from "@/api/user";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId || storedUserId === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getUserById(storedUserId);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      localStorage.removeItem("userId");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const userData = await loginApi(credentials);

      const user = userData.user;
      setUser(user);
      localStorage.setItem("userId", user.userId);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };

  const refreshUser = () => initializeAuth();

  useEffect(() => {
    initializeAuth();
  }, []);

  return { user, isLoading, login, logout, refreshUser };
}
