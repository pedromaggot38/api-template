import hpp from 'hpp';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';
import AppError from './utils/appError.js';
import errorHandler from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { swaggerUi, specs, uiOptions } from './config/swagger.js';

const app = express();

app.use(
  helmet({
    hsts: process.env.NODE_ENV === 'production',
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.disable('x-powered-by');

app.set('trust proxy', true);
app.use(hpp());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/public', express.static('uploads'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

app.use('/api/v1', apiLimiter);

app.use('/api/v1', routes);

app.all('{*path}', (req, res, next) => {
  next(
    new AppError(`Rota ${req.originalUrl} não encontrada no servidor.`, 404),
  );
});

app.use(errorHandler);

export default app;
