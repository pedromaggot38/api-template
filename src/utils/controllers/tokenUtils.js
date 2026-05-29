import jwt from 'jsonwebtoken';

/**
 * Assina um Access Token de tempo curto
 * @param {string} id - ID do usuário
 */
export const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

/**
 * Assina um Refresh Token de tempo longo
 * @param {string} id - ID do usuário
 */
export const signRefreshToken = (id) => {
  return jwt.sign(
    { id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
  );
};

/**
 * Verifica a assinatura criptográfica de um Refresh Token
 * @param {string} token - Token enviado pelo cliente
 */
export const verifyRefreshTokenSignature = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
