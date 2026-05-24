import { useParams } from "react-router-dom";
import styles from "./SleepingHistory.module.css"

const SleepingHistory = () => {
  const { reportId: initialReportId } = useParams();
  
  return (
    <div className={styles.screen}>SleepingHistory</div>
  )
}

export default SleepingHistory