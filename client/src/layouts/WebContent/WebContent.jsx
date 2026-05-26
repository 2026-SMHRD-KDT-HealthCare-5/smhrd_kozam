import "./WebContent.css";
import mainIcon1 from "@/assets/images/mainIcon1.png";
import mainIcon2 from "@/assets/images/mainIcon2.png";
import mainIcon3 from "@/assets/images/mainIcon3.png";

const WebContent = () => {
  return (
    <div className="web-content-wrapper">
      <div className="web-content-inner">
        <div className="web-content-copy">
          <div className="web-content-badge">
            <span />
            AI 수면 모니터링 · 코골이 감지 · 알람 연동
          </div>

          <h1 className="web-content-title">
            당신의 편안한 밤,
            <br />
            <span>Kozam</span>이 지켜드립니다.
          </h1>

          <p className="web-content-description">
            코골이를 감지하고 알람으로 관리하여
            <br />더 나은 수면 습관을 만들어 보세요.
          </p>

          <div className="web-content-features">
            <div className="web-content-feature">
              <div className="feature-icon">
                <img src={mainIcon1} alt="" aria-hidden="true" />
              </div>
              <div>
                <strong>코골이 감지</strong>
                <p>정확한 분석으로 코골이를 감지합니다.</p>
              </div>
            </div>

            <div className="web-content-feature">
              <div className="feature-icon">
                <img src={mainIcon2} alt="" aria-hidden="true" />
              </div>
              <div>
                <strong>스마트 알람</strong>
                <p>코골이가 감지되면 부드럽게 알람을 울려요.</p>
              </div>
            </div>

            <div className="web-content-feature">
              <div className="feature-icon">
                <img src={mainIcon3} alt="" aria-hidden="true" />
              </div>
              <div>
                <strong>수면 리포트</strong>
                <p>매일의 수면 데이터를 확인하고 개선해 보세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="web-content-image" />
      </div>
    </div>
  );
};

export default WebContent;
