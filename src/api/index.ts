import express from 'express';
import { usersRouter } from './routes/users';
import { reportsRouter } from './routes/reports';
import { statsRouter } from './routes/stats';

export function createApi() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/users', usersRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/stats', statsRouter);

  return app;
}