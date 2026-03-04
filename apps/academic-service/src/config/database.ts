import knex, { Knex } from 'knex';
import { env } from './env';

// Connexion principale réutilisable
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

// Cache des connexions tenant
const tenantConnections = new Map<string, Knex>();

export const getTenantDb = (schemaName: string): Knex => {
  // Réutiliser la connexion existante si disponible
  if (tenantConnections.has(schemaName)) {
    return tenantConnections.get(schemaName)!;
  }

  // Créer une nouvelle connexion et la mettre en cache
  const connection = knex({
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

  tenantConnections.set(schemaName, connection);
  return connection;
};
