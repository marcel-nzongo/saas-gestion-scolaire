import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Connexion principale (schéma public)
const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME || 'educore_dev',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'educore2024',
  },
  pool: {
    min: 2,
    max: 10,
  },
});

// Connexion pour un tenant spécifique
export const getTenantDb = (schemaName: string): Knex => {
  return knex({
    client: 'postgresql',
    connection: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'educore_dev',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'educore2024',
    },
    searchPath: [schemaName, 'public'],
    pool: {
      min: 1,
      max: 5,
    },
  });
};

export default db;
