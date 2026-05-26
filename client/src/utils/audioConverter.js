/**
 * AudioBuffer를 WAV Blob으로 변환하는 유틸리티
 * AI 서버(librosa)가 ffmpeg 없이도 읽을 수 있도록 WAV 형식을 사용합니다.
 */
export const audioBufferToWav = (buffer) => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const buffer_arr = new ArrayBuffer(length);
  const view = new DataView(buffer_arr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // RIFF 헤더 작성
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // 파일 길이 - 8
  setUint32(0x45564157); // "WAVE"

  // fmt 청크 작성
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // 청크 길이 = 16
  setUint16(1); // PCM 형식
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // 초당 바이트 수
  setUint16(numOfChan * 2); // 블록 정렬
  setUint16(16); // 16비트

  // data 청크 작성
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // 데이터 길이

  // 오디오 데이터 작성 (인터리빙)
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // 클램핑
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // 16비트 변환
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer_arr], { type: "audio/wav" });
};

/**
 * Blob(webm 등)을 AudioBuffer로 디코딩합니다.
 * AI 모델 사양에 맞춰 16000Hz로 리샘플링을 시도합니다.
 */
export const decodeAudio = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  console.log("Decoding blob:", blob.type, "size:", blob.size);
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext({ sampleRate: 16000 });
  
  try {
    // decodeAudioData는 비동기적으로 작동하며 실패 시 에러를 던집니다.
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer).catch(err => {
      console.error("decodeAudioData failed details:", err);
      throw err;
    });
    return audioBuffer;
  } finally {
    await audioContext.close();
  }
};
