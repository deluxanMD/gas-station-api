import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '@/config/env';
import router from '@/routes';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { notFoundMiddleware } from '@/middlewares/notFound.middleware';
import { logger } from '@/utils/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: () => process.env.NODE_ENV === 'test',
  }),
);

app.use(`/api/${env.API_VERSION}`, router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
