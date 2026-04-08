export const resfc = ({
  res,
  code,
  data = null,
  message = null,
  results = null,
}) => {
  const resBody = {
    status: code < 400 ? 'success' : 'error',
  };

  if (message) resBody.message = message;
  if (results !== null) resBody.results = results;

  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    const sanitizedData = JSON.parse(JSON.stringify(data));

    const removePassword = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      if ('password' in obj) delete obj.password;

      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === 'object') {
          removePassword(obj[key]);
        }
      });
    };

    removePassword(sanitizedData);
    resBody.data = sanitizedData;
  }

  return res.status(code).json(resBody);
};
