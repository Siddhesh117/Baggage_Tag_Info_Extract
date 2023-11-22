/* This dashboard currently use in /Home route*/

import styles from "./index.module.css";
import OCRForm from "./ScanImageInfo";

const Dashboard = () => {
  return (
    <div className={styles["dashboard-container"]}>
      <div className={styles["title-container"]}>
        <div className={styles["dashboard-title"]}>OCR SCAN</div>
      </div>
      <OCRForm />
    </div>
  );
};

export default Dashboard;
