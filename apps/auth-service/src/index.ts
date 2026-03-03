import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';

const app = express();

// ================================
// MIDDLEWARES DE SÉCURITÉ
// ================================
app.use(helmet());
app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Trop de requêtes' },
  },
});
app.use('/auth/login', limiter);

// ================================
// MIDDLEWARES GÉNÉRAUX
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ================================
// ROUTES
// ================================
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// ================================
// GESTION DES ERREURS
// ================================
app.use(errorHandler);

// ================================
// DÉMARRAGE
// ================================
app.listen(env.PORT, () => {
  console.log(`🚀 Auth Service démarré sur le port ${env.PORT}`);
  console.log(`📍 Health: http://localhost:${env.PORT}/health`);
  console.log(`🔐 API: http://localhost:${env.PORT}/api/v1/auth`);
});

export default app;
