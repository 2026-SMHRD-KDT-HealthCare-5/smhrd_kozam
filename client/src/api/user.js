// TODO: 실제 API 구현 후, 아래 함수들 수정 필요
export const getUserById = async (id) => {
  const response = {
    success: true,
    data: {
      id: 1,
      loginId: "hs",
      nick: "해성",
      email: "haexunx@gmail.com",
      phone: "010-2202-5508",
      height: 172,
      weight: 73,
      sleeping_posture: "엎드린자세",
      monitoring_count: 12,
      alarm_count: 50,
      joined_at: "2026",
    },
  };
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = {
    success: true,
    data: {},
  };
  return response.success;
};

export const updateSettings = async (id, settingsData) => {
  const response = {
    success: true,
    data: {},
  };
  return response.success;
};
