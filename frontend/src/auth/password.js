export const passwordPolicyText = '10~64자이며 영문 대·소문자, 숫자, 특수문자를 모두 포함해야 합니다.'

export const isValidPassword = (password) =>
  password.length >= 10 &&
  password.length <= 64 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
