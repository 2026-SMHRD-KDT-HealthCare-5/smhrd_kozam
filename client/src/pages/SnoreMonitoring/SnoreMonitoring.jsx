import React, { useState, useRef } from "react";
import axios from "axios";

const SnoreMonitoring = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 💡 웹 브라우저가 가장 안정적으로 지원하는 webm 포맷을 명시합니다.
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // 💡 실제 브라우저가 생성한 타입과 일치시킵니다.
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setPrediction(null);
    } catch (err) {
      console.error("마이크 접근 오류:", err);
      alert("마이크 접근 권한이 필요합니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendToAI = async () => {
    if (audioChunksRef.current.length === 0) return;

    setLoading(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    console.log("blob type:", audioBlob.type);
    console.log("blob size:", audioBlob.size);
    const formData = new FormData();

    // 💡 1. 파이썬 FastAPI가 받는 변수명인 'file'로 매칭합니다.
    // 💡 2. 확장자를 .webm으로 지정하여 파일의 정체를 명확히 합니다.
    formData.append("file", audioBlob, "recording.webm");

    try {
      // Node.js 백엔드를 통해 AI 서버로 전달
      const response = await axios.post(
        "http://localhost:8000/api/ai/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setPrediction(response.data.prediction);
    } catch (err) {
      console.error("AI 예측 요청 오류:", err);
      alert("AI 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>코골이 모니터링</h1>

      <div style={{ marginBottom: "20px" }}>
        {recording ? (
          <button
            onClick={stopRecording}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            녹음 중지
          </button>
        ) : (
          <button
            onClick={startRecording}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            녹음 시작
          </button>
        )}
      </div>

      {audioURL && (
        <div style={{ marginBottom: "20px" }}>
          <audio src={audioURL} controls />
          <br />
          <button
            onClick={sendToAI}
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "분석 중..." : "AI 분석 요청"}
          </button>
        </div>
      )}

      {prediction && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>분석 결과</h2>
          <p>
            <strong>결과:</strong>{" "}
            {prediction.predicted === "snore"
              ? "🔴 코골이 감지"
              : "⚪ 일반 소음"}
          </p>
          <p>
            <strong>코골이 확률:</strong>{" "}
            {(prediction.snore_prob * 100).toFixed(2)}%
          </p>
          <p>
            <strong>강도(Intensity):</strong> {prediction.intensity}
          </p>
        </div>
      )}
    </div>
  );
};

export default SnoreMonitoring;
