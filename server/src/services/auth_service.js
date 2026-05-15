exports.login = async ({ loginId, password }) => {
  // TODO: DB 조회 후 로그인 처리 (JWT 적용 고민)

  // 임시 유저 데이터 (DB 대신)
  const fakeUser = {
    id: 1,
    loginId: "test123",
    password: "123",
    nick: "해성",
  };

  // 아이디 체크
  if (loginId !== fakeUser.loginId) {
    throw new Error("아이디가 존재하지 않습니다.");
  }

  // 비밀번호 체크
  if (password !== fakeUser.password) {
    throw new Error("비밀번호가 틀렸습니다.");
  }

  // 성공 시 필요한 데이터 반환
  return {
    id: fakeUser.id,
    loginId: fakeUser.loginId,
    nick: fakeUser.nick,
  };
};
