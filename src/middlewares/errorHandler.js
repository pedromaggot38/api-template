import AppError from '../utils/appError.js';

const translateModel = (modelName) => {
  const models = {
    User: 'Usuário',
  };
  return models[modelName] || modelName || 'Registro';
};

const handlePrismaDuplicateFieldError = (err) => {
  let field = 'campo';

  if (Array.isArray(err.meta?.target)) {
    field = err.meta.target.join(', ');
  } else if (typeof err.meta?.target === 'string') {
    field = err.meta.target;
  }

  const message = `O valor informado para '${field}' já está em uso.`;
  return new AppError(message, 400);
};

const handlePrismaEnumError = (err) => {
  const fieldMatch = err.message?.match(
    /Argument `(\w+)`: Invalid value provided/,
  );
  const expectedMatch = err.message?.match(/Expected (.+),/);

  const field = fieldMatch ? fieldMatch[1] : 'campo';
  const rawValues = expectedMatch ? expectedMatch[1] : 'um valor válido';
  const cleanValues = rawValues.replace(/\w+\./g, '').replace(/ or /g, ', ');

  const message = `O valor para '${field}' é inválido. Esperado: ${cleanValues}.`;
  return new AppError(message, 400);
};

const handlePrismaValidationError = () => {
  return new AppError(
    'Dados enviados são inválidos ou estão em um formato incorreto.',
    400,
  );
};

const handlePrismaNotFoundError = (err) => {
  const model = translateModel(err.meta?.modelName);
  return new AppError(`${model} não encontrado(a).`, 404);
};

const handleForeignKeyConstraintError = (err) => {
  const fieldName = err.meta?.field_name || '';

  if (err.message?.includes('foreign key constraint fails') || fieldName) {
    return new AppError(
      `O registro referenciado (${fieldName || 'chave estrangeira'}) não existe ou possui dependências vinculadas.`,
      400,
    );
  }

  return new AppError(
    'Não foi possível concluir a operação: existem dados dependentes deste registro.',
    400,
  );
};

const handleValueTooLongError = (err) => {
  const column = err.meta?.column_name || 'campo';
  return new AppError(
    `O valor inserido no campo '${column}' excede o tamanho máximo permitido.`,
    400,
  );
};

const handleFastifyValidationError = (err) => {
  const rawErrors = err.validation || [];
  const errors = rawErrors.map((e) => {
    const campo = e.instancePath
      ? e.instancePath.replace(/^\//, '')
      : 'formulario';
    return {
      campo: campo,
      mensagem: e.message,
    };
  });

  return new AppError('Erro de validação nos campos enviados.', 400, errors);
};

const handleJWTError = () =>
  new AppError('Token inválido. Faça login novamente.', 401);

const handleJWTExpiredError = () =>
  new AppError('Sua sessão expirou. Faça login novamente.', 401);

const sendErrorDev = (rawErr, treatedErr, reply) => {
  const statusCode = treatedErr.statusCode || 500;
  return reply.status(statusCode).send({
    status: treatedErr.status || (statusCode >= 500 ? 'error' : 'fail'),
    message: treatedErr.message || rawErr.message,
    errors: treatedErr.errors || [],
    devDetails: {
      originalMessage: rawErr.message,
      code: rawErr.code,
      meta: rawErr.meta,
      isOperational: treatedErr.isOperational || false,
      stack: rawErr.stack,
    },
  });
};

const sendErrorProd = (err, request, reply) => {
  if (err.isOperational) {
    return reply.status(err.statusCode).send({
      status: err.status,
      message: err.message,
      errors: err.errors || [],
    });
  }

  request.log.error(
    {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    'CRITICAL ERROR 💥',
  );

  return reply.status(500).send({
    status: 'error',
    message: 'Ocorreu um erro interno no servidor.',
  });
};

const enrichError = (err) => {
  if (err.isOperational) return err;

  if (err.validation) return handleFastifyValidationError(err);

  if (err.name === 'JsonWebTokenError') return handleJWTError();
  if (err.name === 'TokenExpiredError') return handleJWTExpiredError();

  // Códigos de erro conhecidos do Prisma
  if (err.code === 'P2002') return handlePrismaDuplicateFieldError(err);
  if (err.code === 'P2025') return handlePrismaNotFoundError(err);
  if (err.code === 'P2003') return handleForeignKeyConstraintError(err);
  if (err.code === 'P2000') return handleValueTooLongError(err);

  if (err.name === 'PrismaClientValidationError') {
    return err.message?.includes('provided')
      ? handlePrismaEnumError(err)
      : handlePrismaValidationError();
  }

  return err;
};

export const errorHandler = (err, request, reply) => {
  const enrichedError = enrichError(err);

  enrichedError.statusCode = enrichedError.statusCode || 500;
  enrichedError.status =
    enrichedError.status ||
    (enrichedError.statusCode >= 500 ? 'error' : 'fail');

  if (enrichedError.isOperational) {
    request.log.warn({
      path: request.url,
      method: request.method,
      statusCode: enrichedError.statusCode,
      message: `Operational Error: ${enrichedError.message}`,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, enrichedError, reply);
  }

  return sendErrorProd(enrichedError, request, reply);
};
