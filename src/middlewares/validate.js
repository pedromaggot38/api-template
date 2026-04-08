const validate =
  (schema, target = 'body') =>
  (req, res, next) => {
    try {
      const parsedData = schema.parse(req[target]);

      req[target] = parsedData;

      next();
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({
          erros: error.issues.map((err) => ({
            campo: err.path[err.path.length - 1] || 'formulario',
            mensagem: err.message,
          })),
        });
      }
      next(error);
    }
  };

export default validate;
