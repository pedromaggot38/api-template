import hpp from 'hpp';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';
import AppError from './utils/appError.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(
  helmet({
    hsts: process.env.NODE_ENV === 'production',
  }),
);

app.set('trust proxy', true);
app.use(hpp());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Ative para suportar cookies HttpOnly
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', routes);

app.all('{*path}', (req, res, next) => {
  next(
    new AppError(`Rota ${req.originalUrl} não encontrada no servidor.`, 404),
  );
});

app.use(errorHandler);

export default app;
