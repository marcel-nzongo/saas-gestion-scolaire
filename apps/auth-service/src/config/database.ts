import knex from 'knex';
import { env } from './env';

// Connexion schéma public
export const db = knex({
  client: 'postgresql',
  connection: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
  },
  pool: { min: 2, max: 10 },
});

// Connexion pour un tenant
export const getTenantDb = (schemaName: string) => {
  return knex({
    client: 'postgresql',
    connection: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      database: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
    },
    searchPath: [schemaName, 'public'],
    pool: { min: 1, max: 5 },
  });
};
