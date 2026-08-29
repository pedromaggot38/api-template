import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: [
    'req.headers.authorization',
    'body.password',
    'body.token',
    'body.otp',
  ],
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino-roll',
        level: 'info',
        options: {
          file: './logs/app',
          frequency: 'daily',
          size: '20m',
          mkdir: true,
        },
      },
      {
        target: 'pino-roll',
        level: 'error',
        options: {
          file: './logs/error',
          frequency: 'daily',
          size: '20m',
          mkdir: true,
        },
      },
    ],
  },
});

export default logger;
