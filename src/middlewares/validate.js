const validate =
  (schema, target = 'body') =>
  (req, res, next) => {
    try {
      const dataToValidate = req[target] || {};

      const parsedData = schema.parse(dataToValidate);

      if (target === 'query' || target === 'params') {
        Object.keys(req[target]).forEach((key) => delete req[target][key]);
        Object.assign(req[target], parsedData);
      } else {
        req[target] = parsedData;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default validate;
