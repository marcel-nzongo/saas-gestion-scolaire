import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.AUTH_SERVICE_PORT) || 3001,

  // Database
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 5432,
  DATABASE_NAME: process.env.DATABASE_NAME || 'educore_dev',
  DATABASE_USER: process.env.DATABASE_USER || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // App
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
};
