export const resfc = ({
  reply,
  code = 200,
  data = null,
  message = null,
  meta = null,
}) => {
  const resBody = {
    status: code < 400 ? 'success' : 'error',
  };

  if (message) {
    resBody.message = message;
  }

  if (meta !== null && meta !== undefined) {
    resBody.meta = meta;
  }

  if (data !== null && data !== undefined) {
    if (typeof data === 'object') {
      const sanitizedData = JSON.parse(JSON.stringify(data));

      const removePassword = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if ('password' in obj) {
          delete obj.password;
        }

        Object.keys(obj).forEach((key) => {
          if (obj[key] && typeof obj[key] === 'object') {
            removePassword(obj[key]);
          }
        });
      };

      removePassword(sanitizedData);
      resBody.data = sanitizedData;
    } else {
      resBody.data = data;
    }
  }

  return reply.status(code).send(resBody);
};
