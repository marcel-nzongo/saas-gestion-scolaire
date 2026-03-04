import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

console.log(
  '🔑 JWT_ACCESS_SECRET:',
  process.env.JWT_ACCESS_SECRET || 'NON CHARGÉ',
);

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.ACADEMIC_SERVICE_PORT) || 3002,
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 5432,
  DATABASE_NAME: process.env.DATABASE_NAME || 'educore_dev',
  DATABASE_USER: process.env.DATABASE_USER || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret',
};
