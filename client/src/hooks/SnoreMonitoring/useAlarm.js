// hooks/useAlarm.js
import { useRef, useCallback, useEffect } from "react";

import birdsSound from "@/assets/sounds/birdsSinging.mp3";

const ALARM_SOUNDS = {
  bird: birdsSound,
};

export function useAlarm(soundType = "bird") {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  // 🎯 3. 키워드에 맞는 실제 파일 경로를 매핑합니다.
  const audioUrl = ALARM_SOUNDS[soundType] || ALARM_SOUNDS.bird;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }

    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = false;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        isPlayingRef.current = false;
      }
    };
  }, [audioUrl]); // 오디오 경로가 바뀔 때만 재세팅

  // 🔊 playAlarm, stopAlarm 등 기존 로직은 그대로 유지...
  const playAlarm = useCallback(async () => {
    if (!audioRef.current || isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      isPlayingRef.current = false;
      if (error.name !== "AbortError") console.error("재생 실패:", error);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  const isPlayingAlarm = isPlayingRef.current;

  return { playAlarm, stopAlarm, isPlayingAlarm };
}
