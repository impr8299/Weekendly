import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config.js';
import { waitlistRouter } from './routes/waitlist.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errors.js';

// Builds the Express app (kept separate from server.js so it can be tested later without a running server).
export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind nginx in Docker; needed for correct client IPs in rate limiting
  app.use(helmet());
  // Only the listed frontend origins may call the API; credentials allows the team session cookie.
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/waitlist', waitlistRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
