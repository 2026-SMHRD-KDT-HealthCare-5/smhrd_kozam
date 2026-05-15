import { useContext, useState } from "react";
import AuthContext from "../../contexts/AuthContext";
import "./Login.css";
import { login } from "../../api/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  const { setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login({ loginId: inputId, password: inputPw });
      setIsLoggedIn(true);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div>
      <div className="login-logo-image" style={{ color: "red" }}>
        LOGO IMAGE
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="loginId">ID</label>
        <br />
        <input
          type="text"
          placeholder="Enter your ID"
          id="loginId"
          name="loginId"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
        />
        <p>Use the ID associated with your account.</p>
        <br />
        <label htmlFor="password">Password</label>
        <br />
        <input
          type="password"
          placeholder="Enter your password"
          id="password"
          name="password"
          value={inputPw}
          onChange={(e) => setInputPw(e.target.value)}
        />
        <p>Minimum 8 characters</p>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
