import { useAuth } from "client/src/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SnoreMonitoring = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      SnoreMonitoring
      <button
        style={{
          width: "100px",
          height: "100px",
          color: "white",
          backgroundColor: "red",
        }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default SnoreMonitoring;
