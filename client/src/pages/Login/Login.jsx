import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api/auth";
import AuthContext from "@/contexts/AuthContext";
import Logo from "@components/Logo";
import styles from "./Login.module.css";

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
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.logoBlock}>
          <div className={styles.moonWrap}>
            <Logo width="240px" height="180px" />
          </div>
        </header>

        <form className={styles.formArea} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-id">
              ID
            </label>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="Enter your ID"
                id="loginId"
                name="loginId"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className={styles.input}
                autoComplete="username"
              />
            </div>
            <p className={styles.hint}>
              Use the ID associated with your account.
            </p>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <input
                type="password"
                placeholder="Enter your password"
                id="password"
                name="password"
                value={inputPw}
                onChange={(e) => setInputPw(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
              />
            </div>
            <p className={styles.hint}>Minimum 8 characters</p>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.signInBtn}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
