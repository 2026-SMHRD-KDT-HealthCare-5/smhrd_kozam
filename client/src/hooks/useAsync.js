/* 
  // 기본 사용
  const {
    status,       // 'idle' | 'loading' | 'success' | 'error'
    data,         // 성공 시 반환 데이터
    error,        // Error 객체
    execute,      // 비동기 함수 실행 트리거
    reset,        // 상태 초기화
    isIdle,       // boolean 편의 플래그
    isLoading,
    isSuccess,
    isError,
  } = useAsync(asyncFn, {
    immediate,    // 마운트 시 즉시 실행 (default: false)
    initialData,  // 초기 data 값 (default: null)
    onSuccess,    // (data) => void
    onError,      // (error) => void
  });
*/

import { useState, useCallback, useRef, useEffect } from "react";

export function useAsync(asyncFn, options = {}) {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [state, setState] = useState({
    status: "idle",
    data: initialData,
    error: null,
  });

  const isMountedRef = useRef(true);

  // 컴포넌트 언마운트 시 isMountedRef를 false로 설정하여 상태 업데이트 방지
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (!isMountedRef.current) return;
      setState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const data = await asyncFn(...args);
        if (!isMountedRef.current) return;
        setState({ status: "success", data, error: null });
        onSuccess?.(data);
        return data;
      } catch (err) {
        if (!isMountedRef.current) return;

        // axios 에러 처리
        const error = err.response
          ? new Error(
              `${err.response.status}: ${err.response.data?.message ?? err.message}`,
            )
          : new Error(err.message ?? String(err));
        setState({ status: "error", data: initialData, error });
        onError?.(error);
        throw error;
      }
    },
    [asyncFn, onSuccess, onError, initialData],
  );

  const reset = useCallback(() => {
    setState({ status: "idle", data: initialData, error: null });
  }, [initialData]);

  useEffect(() => {
    if (immediate) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: state.status === "idle",
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
  };
}
