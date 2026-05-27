/**
 * Injeta o Refresh Token nos Cookies da resposta HTTP (HttpOnly e Secure)
 * @param {Object} res - Resposta Express
 * @param {Object} req - Requisição Express
 * @param {string} refreshToken - Token JWT de renovação longa
 */
export const setRefreshTokenCookie = (res, req, refreshToken) => {
  const expireDays =
    parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN, 10) || 7;

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict',
  });
};

/**
 * Limpa o cookie do Refresh Token do navegador do cliente no Logout
 * @param {Object} res - Resposta Express
 */
export const clearRefreshTokenCookie = (res) => {
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
    sameSite: 'strict',
  });
};
