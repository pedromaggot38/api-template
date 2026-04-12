import { ZodError } from 'zod';
import logger from '../utils/logger.js';
import AppError from '../utils/appError.js';

const translateModel = (modelName) => {
  const models = {
    User: 'Usuário',
  };
  return models[modelName] || modelName || 'Registro';
};

const handlePrismaDuplicateFieldError = (err) => {
  const field = err.meta?.target?.[0] || 'campo';
  const message = `O valor informado para '${field}' já está em uso.`;
  return new AppError(message, 400);
};

const handlePrismaEnumError = (err) => {
  const fieldMatch = err.message.match(
    /Argument `(\w+)`: Invalid value provided/,
  );
  const expectedMatch = err.message.match(/Expected (.+),/);

  const field = fieldMatch ? fieldMatch[1] : 'campo';
  const rawValues = expectedMatch ? expectedMatch[1] : 'um valor válido';

  const cleanValues = rawValues.replace(/\w+\./g, '').replace(/ or /g, ', ');

  const message = `O valor para '${field}' é inválido. Esperado: ${cleanValues}.`;
  return new AppError(message, 400);
};

const handlePrismaValidationError = (err) => {
  const message =
    'Dados enviados são inválidos ou estão em um formato incorreto.';
  return new AppError(message, 400);
};

const handlePrismaNotFoundError = (err) => {
  const model = translateModel(err.meta?.modelName);
  return new AppError(`${model} não encontrado(a).`, 404);
};

const handleForeignKeyConstraintError = (err) => {
  const message = `Não foi possível concluir a operação: existem dados dependentes deste registro.`;
  return new AppError(message, 400);
};

const handleZodError = (err) => {
  const errors = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return new AppError('Erro de validação nos campos enviados.', 400, errors);
};

const handleJWTError = () =>
  new AppError('Token inválido. Faça login novamente.', 401);
const handleJWTExpiredError = () =>
  new AppError('Sua sessão expirou. Faça login novamente.', 401);

const sendErrorDev = (rawErr, treatedErr, res) => {
  res.status(rawErr.statusCode).json({
    status: rawErr.status,
    message: rawErr.message,
    productionPreview: {
      status: treatedErr.status,
      message: treatedErr.message,
      errors: treatedErr.errors || [],
      isOperational: treatedErr.isOperational || false,
    },
    error: rawErr,
    stack: rawErr.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors || [],
    });
  } else {
    logger.error('CRITICAL ERROR 💥', { 
      message: err.message,
      stack: err.stack,
      name: err.name 
    });
    res.status(500).json({
      status: 'error',
      message: 'Ocorreu um erro interno no servidor.',
    });
  }
};

const enrichError = (err) => {
  let error = { ...err, message: err.message, name: err.name, code: err.code };

  if (error.code === 'P2002') return handlePrismaDuplicateFieldError(error);
  if (error.code === 'P2025') return handlePrismaNotFoundError(error);
  if (error.code === 'P2003') return handleForeignKeyConstraintError(error);
  if (error.name === 'ZodError') return handleZodError(err);
  if (error.name === 'JsonWebTokenError') return handleJWTError();
  if (error.name === 'TokenExpiredError') return handleJWTExpiredError();

  if (error.name === 'PrismaClientValidationError') {
    return error.message.includes('provided')
      ? handlePrismaEnumError(error)
      : handlePrismaValidationError(error);
  }

  return error;
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const enrichedError = enrichError(err);

  if (enrichedError.isOperational) {
    logger.warn(`Operational Error: ${enrichedError.message}`, {
      path: req.originalUrl,
      method: req.method,
      statusCode: enrichedError.statusCode
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, enrichedError, res);
  }

  sendErrorProd(enrichedError, res);
};
