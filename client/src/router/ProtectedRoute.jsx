import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "@/contexts/AuthContext";

const ProtectedRoute = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
