import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { ZodError } from 'zod';
import companyRoutes from './routes/company.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import authRoutes from './routes/auth.routes.js';
import organizationSettingsRoutes from './routes/organizationSettings.routes.js';
import stateRoutes from './routes/state.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), authRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/organization-settings', organizationSettingsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/invoices', invoiceRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(422).json({ message: 'Invalid invoice data', errors: error.flatten() });
  if (error?.code === 11000) return res.status(409).json({ message: 'A record with that unique value already exists.' });
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
});
export default app;
