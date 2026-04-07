import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js'

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Rota não encontrada no servidor.' 
  });
});

app.use(errorHandler);

export default app;