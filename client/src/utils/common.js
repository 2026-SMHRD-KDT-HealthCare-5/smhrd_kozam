export const formatSecondsToTime = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
};

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export const convertMsToTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);

  const hour = Math.floor(totalSeconds / 3600);
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;

  return { hour, minute, second };
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return { hour, minute };
};
