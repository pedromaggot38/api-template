export const resfc = (
  res,
  code,
  data = null,
  message = null,
  results = null,
) => {
  const resBody = {
    status: 'success',
  };

  if (message) resBody.message = message;
  if (results !== null) resBody.results = results;

  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    const sanitizedData = JSON.parse(JSON.stringify(data));
    if ('password' in sanitizedData) {
      delete sanitizedData.password;
    }
    for (const key in sanitizedData) {
      if (
        sanitizedData[key] &&
        typeof sanitizedData[key] === 'object' &&
        'password' in sanitizedData[key]
      ) {
        delete sanitizedData[key].password;
      }
    }

    resBody.data = sanitizedData;
  }

  return res.status(code).json(resBody);
};
