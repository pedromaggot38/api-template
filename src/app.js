import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import AppError from './utils/appError.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  loggerInstance: logger,
  routerOptions: {
    ignoreTrailingSlash: true,
  },
});

fastify.setErrorHandler(errorHandler);

await fastify.register(cors);
await fastify.register(helmet);
await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
});

await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/public/',
});

if (process.env.NODE_ENV === 'production') {
  await fastify.register(fastifyRateLimit, {
    max: 500,
    timeWindow: 15 * 60 * 1000,
    errorResponseBuilder: (request, context) => {
      const isAuthRoute = context.max < 15;
      const message = isAuthRoute
        ? 'Muitas tentativas de login. Tente novamente em uma hora.'
        : 'Muitas requisições, tente novamente mais tarde.';

      throw new AppError(message, 429);
    },
  });
}

await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API Template',
      version: '1.0.0',
      description: 'Documentação da API RESTful',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});
await fastify.register(apiRoutes, { prefix: '/api/v1' });

export default fastify;
