import xss from 'xss';

/**
 * Remove espaços em branco nas extremidades e sanitiza contra XSS.
 */
export const sanitizeString = (val) => {
  return typeof val === 'string' ? xss(val.trim()) : val;
};

/**
 * Remove espaços em branco nas extremidades, converte para minúsculas e sanitiza contra XSS.
 * Ideal para e-mails e usernames.
 */
export const normalizeInput = (val) => {
  return typeof val === 'string' ? xss(val.trim().toLowerCase()) : val;
};
