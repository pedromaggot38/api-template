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
    request.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  reply.setCookie('refreshToken', refreshToken, {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
  });
};

/**
 * Limpa o cookie do Refresh Token do navegador do cliente no Logout
 * Força a expiração para 1970 com maxAge: 0 garantindo a destruição no browser.
 * @param {Object} reply - Resposta Fastify
 * @param {Object} [request] - Requisição Fastify (opcional)
 */
export const clearRefreshTokenCookie = (reply, request) => {
  const isSecure =
    request?.protocol === 'https' ||
    request?.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  reply.setCookie('refreshToken', '', {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    expires: new Date(0),
    maxAge: 0,
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
    request.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  reply.setCookie('accessToken', accessToken, {
    expires: new Date(Date.now() + minutes * 60 * 1000),
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
  });
};

/**
 * Limpa o cookie do Access Token do navegador do cliente no Logout
 * Força a expiração para 1970 com maxAge: 0 garantindo a destruição no browser.
 * @param {Object} reply - Resposta Fastify
 * @param {Object} [request] - Requisição Fastify (opcional)
 */
export const clearAccessTokenCookie = (reply, request) => {
  const isSecure =
    request?.protocol === 'https' ||
    request?.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  reply.setCookie('accessToken', '', {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    expires: new Date(0),
    maxAge: 0,
  });
};
