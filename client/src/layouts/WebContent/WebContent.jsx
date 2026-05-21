import "./WebContent.css";

const WebContent = () => {
  return (
    <div className="web-content-wrapper">
      WebContentWrapper
      <div className="web-content-inner">
        <div className="web-content-copy">
          <h1 className="web-content-title">
            당신의 편안한 밤,
            <br />
            <span>Kozam</span>이 지켜드립니다.
          </h1>

          <p className="web-content-description">
            코골이를 감지하고 알람으로 관리하여
            <br />더 나은 수면 습관을 만들어 보세요.
          </p>
        </div>
        <div className="web-content-image" />
      </div>
    </div>
  );
};

export default WebContent;
