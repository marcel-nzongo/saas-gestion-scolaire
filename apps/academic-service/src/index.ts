import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';
import path from 'path';
import express from 'express';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api/v1', routes);
// Dans la config de l'app, ajoute :
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'academic-service',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Academic Service démarré sur le port ${env.PORT}`);
  console.log(`📍 Health: http://localhost:${env.PORT}/health`);
});

export default app;
