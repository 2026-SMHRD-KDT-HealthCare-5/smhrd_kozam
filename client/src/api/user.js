// TODO: 실제 API 구현 후, 아래 함수들 수정 필요
export const getUserById = async (id) => {
  const response = {
    success: true,
    data: { id: 1, loginId: "test123", nick: "해성" },
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
