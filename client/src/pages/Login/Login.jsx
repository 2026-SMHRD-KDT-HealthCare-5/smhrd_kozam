import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api/auth";
import styles from "./Login.module.css";
import { useAuth } from "../../hooks/useAuth";

function MoonIcon() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M72 8C45 8 23 30 23 57c0 15 6 29 16 39 2 2 5 3 8 3 4 0 7-2 9-5 3-5 2-12-3-16a33 33 0 0 1-10-24c0-18 15-33 33-33 6 0 12 2 17 4 4 2 9 1 12-2 3-3 4-8 2-12C98 12 86 8 72 8Z"
        fill="#E8E4FF"
      />
    </svg>
  );
}

const Login = () => {
  // TODO: 비제어 컴포넌트로 변경
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  // TODO: preventDefault 제거 후 submit 이벤트로 로그인 처리
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
            <MoonIcon />
          </div>
          <p className={styles.brandText}>Kozam</p>
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
