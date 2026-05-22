export const requestMicPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // 사용 끝나면 stream 정리
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error("마이크 권한 거부", error);

    return false;
  }
};

export const checkMicPermission = async () => {
  try {
    const result = await navigator.permissions.query({
      name: "microphone",
    });

    /* result.state
      granted  : 허용
      denied   : 거부
      prompt   : 아직 안 물어봄
    */

    return result;
  } catch (error) {
    console.error(error);
  }
};
