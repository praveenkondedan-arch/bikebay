import path from 'path';
import express from 'express';
import cors from 'cors';
import { ENV } from './server/config/env.ts';
import { connectDatabase } from './server/db/store.ts';
import authRoutes from './server/routes/authRoutes.ts';
import serviceTypeRoutes from './server/routes/serviceTypeRoutes.ts';
import mechanicRoutes from './server/routes/mechanicRoutes.ts';
import bikeRoutes from './server/routes/bikeRoutes.ts';
import bookingRoutes from './server/routes/bookingRoutes.ts';
import invoiceRoutes from './server/routes/invoiceRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';

async function startServer() {
  await connectDatabase();

  const app = express();

  app.use(
    cors({
      origin: ENV.CLIENT_URL === '*' ? true : ENV.CLIENT_URL.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/services', serviceTypeRoutes);
  app.use('/api/mechanics', mechanicRoutes);
  app.use('/api/bikes', bikeRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/admin', adminRoutes);

  if (ENV.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`[Server] MotoBay running on http://0.0.0.0:${ENV.PORT} (${ENV.NODE_ENV})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
