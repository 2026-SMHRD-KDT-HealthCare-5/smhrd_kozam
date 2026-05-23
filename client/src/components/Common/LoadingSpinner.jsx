import { FadeLoader  } from "react-spinners";
import styles from "./LoadingSpinner.module.css";

const LoadingSpinner = () => {
  return (
    <div className={styles.overlay}>
      <FadeLoader  size={24} color={"#6126c7"} />
    </div>
  );
};

export default LoadingSpinner;
