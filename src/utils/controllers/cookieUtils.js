/**
 * Injeta o Refresh Token nos Cookies da resposta HTTP (HttpOnly e Secure)
 * @param {Object} reply - Resposta Fastify
 * @param {Object} request - Requisição Fastify
 * @param {string} refreshToken - Token JWT de renovação longa
 */
export const setRefreshTokenCookie = (reply, request, refreshToken) => {
  const expireDays =
    parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN, 10) || 7;

  const isSecure =
    request.protocol === 'https' ||
    request.headers['x-forwarded-proto'] === 'https';

  reply.setCookie('refreshToken', refreshToken, {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Limpa o cookie do Refresh Token do navegador do cliente no Logout
 * @param {Object} reply - Resposta Fastify
 */
export const clearRefreshTokenCookie = (reply) => {
  reply.clearCookie('refreshToken', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
  });
};

/**
 * Injeta o Access Token nos Cookies da resposta HTTP (HttpOnly e Secure)
 * @param {Object} reply - Resposta Fastify
 * @param {Object} request - Requisição Fastify
 * @param {string} accessToken - Token JWT de tempo curto
 */
export const setAccessTokenCookie = (reply, request, accessToken) => {
  let minutes = parseInt(process.env.JWT_ACCESS_EXPIRES_IN, 10);
  if (isNaN(minutes)) minutes = 15;

  const isSecure =
    request.protocol === 'https' ||
    request.headers['x-forwarded-proto'] === 'https';

  reply.setCookie('accessToken', accessToken, {
    expires: new Date(Date.now() + minutes * 60 * 1000),
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Limpa o cookie do Access Token do navegador do cliente no Logout
 * @param {Object} reply - Resposta Fastify
 */
export const clearAccessTokenCookie = (reply) => {
  reply.clearCookie('accessToken', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
  });
};
